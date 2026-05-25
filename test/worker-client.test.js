import assert from 'node:assert/strict';
import test from 'node:test';

import { WORKER_MESSAGE } from '../src/interpreter/worker-protocol.js';
import { createInterpreterWorkerClient } from '../src/renderer/worker-client.js';

test('worker client resolves successful run responses', async () => {
  const fakeWorker = {
    postMessage(message) {
      queueMicrotask(() => {
        fakeWorker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: message.id,
            payload: { output: ['ok'] }
          }
        });
      });
    },
    terminate() {}
  };

  const client = createInterpreterWorkerClient({ worker: fakeWorker });
  const result = await client.run('codigo', {});

  assert.deepEqual(result.output, ['ok']);
});

test('worker client rejects error responses and supports fallback run', async () => {
  const errorWorker = {
    postMessage(message) {
      queueMicrotask(() => {
        errorWorker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_ERROR,
            id: message.id,
            error: { message: 'Falhou' }
          }
        });
      });
    },
    terminate() {}
  };

  const client = createInterpreterWorkerClient({ worker: errorWorker });
  await assert.rejects(() => client.run('codigo', {}), /Falhou/);

  const fallback = createInterpreterWorkerClient({
    fallbackRun: async (source, options) => ({ output: [source, options.flag] })
  });

  assert.deepEqual(await fallback.run('direto', { flag: 'ok' }), { output: ['direto', 'ok'] });
});

test('worker client uses fallback when unsupported options cannot be posted to a Worker', async () => {
  let posted = false;
  const worker = {
    postMessage() {
      posted = true;
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({
    worker,
    fallbackRun: async () => ({ output: ['fallback'] })
  });

  assert.deepEqual(await client.run('codigo', { transform() {} }), { output: ['fallback'] });
  assert.equal(posted, false);
});

test('worker client bridges read requests to onRead handlers', async () => {
  let runRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.RUN_START) {
        runRequestId = message.id;
        assert.equal(message.payload.options.__useWorkerReadBridge, true);
        assert.equal('onRead' in message.payload.options, false);
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.READ_REQUEST,
              id: 'read-1',
              payload: {
                requestId: message.id,
                request: { name: 'nome' }
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.READ_RESPONSE);
      assert.equal(message.id, 'read-1');
      assert.equal(message.payload.value, 'Ana');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: runRequestId,
            payload: { output: ['Ana'] }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({ worker });

  const result = await client.run('codigo', {
    onRead: async (request) => `${request.name === 'nome' ? 'Ana' : ''}`
  });

  assert.deepEqual(result.output, ['Ana']);
});

test('worker client exposes a debug session facade', async () => {
  const fakeWorker = {
    postMessage(message) {
      queueMicrotask(() => {
        const sessionId = message.payload.sessionId ?? 's1';
        fakeWorker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: message.id,
            payload: {
              sessionId,
              snapshot: {
                active: message.type !== WORKER_MESSAGE.DEBUG_STOP,
                index: message.type === WORKER_MESSAGE.DEBUG_NEXT ? 1 : 0,
                total: 2,
                step: { line: 1, output: [] }
              }
            }
          }
        });
      });
    },
    terminate() {}
  };

  const client = createInterpreterWorkerClient({ worker: fakeWorker });
  const session = client.createDebugSession('codigo', { breakpoints: [1] });

  assert.equal((await session.current()).index, 0);
  assert.equal((await session.next()).index, 1);
  assert.equal((await session.stop()).active, false);
});

test('worker client bridges debug read requests to onRead handlers', async () => {
  let debugRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.DEBUG_START) {
        debugRequestId = message.id;
        assert.equal(message.payload.options.__useWorkerReadBridge, true);
        assert.equal('onRead' in message.payload.options, false);
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.READ_REQUEST,
              id: 'debug-read-1',
              payload: {
                requestId: message.id,
                request: { name: 'idade' }
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.READ_RESPONSE);
      assert.equal(message.id, 'debug-read-1');
      assert.equal(message.payload.value, '12');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: debugRequestId,
            payload: {
              sessionId: 's1',
              snapshot: {
                active: true,
                index: 0,
                total: 1,
                step: { line: 1, output: ['12'] }
              }
            }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({
    worker,
    fallbackDebug: () => {
      throw new Error('debug fallback should not run');
    }
  });

  const session = client.createDebugSession('codigo', {
    onRead: async (request) => `${request.name === 'idade' ? '12' : ''}`
  });

  assert.deepEqual((await session.current()).step.output, ['12']);
});

test('worker client keeps debug read handlers after the initial snapshot', async () => {
  let debugRequestId = null;
  let nextRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.DEBUG_START) {
        debugRequestId = message.id;
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.RESPONSE_SUCCESS,
              id: message.id,
              payload: {
                sessionId: 's1',
                snapshot: {
                  active: true,
                  index: 0,
                  total: 2,
                  step: { line: 1, output: [] }
                }
              }
            }
          });
        });
        return;
      }

      if (message.type === WORKER_MESSAGE.DEBUG_NEXT) {
        nextRequestId = message.id;
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.READ_REQUEST,
              id: 'debug-read-after-start',
              payload: {
                requestId: debugRequestId,
                request: { name: 'nome' }
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.READ_RESPONSE);
      assert.equal(message.id, 'debug-read-after-start');
      assert.equal(message.payload.value, 'Ana');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: nextRequestId,
            payload: {
              snapshot: {
                active: true,
                index: 1,
                total: 2,
                step: { line: 2, output: ['Ana'] }
              }
            }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({ worker });
  const session = client.createDebugSession('codigo', {
    onRead: async (request) => `${request.name === 'nome' ? 'Ana' : ''}`
  });

  assert.equal((await session.current()).index, 0);
  assert.deepEqual((await session.next()).step.output, ['Ana']);
});

test('worker client uses fallback debug session when unsupported options cannot be posted to a Worker', async () => {
  let posted = false;
  const worker = {
    postMessage() {
      posted = true;
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({
    worker,
    fallbackDebug: () => ({
      current: async () => ({ active: true, index: 0 })
    })
  });

  const session = client.createDebugSession('codigo', { transform() {} });

  assert.equal((await session.current()).index, 0);
  assert.equal(posted, false);
});

test('worker client uses fallback debug session when worker is unavailable', async () => {
  const client = createInterpreterWorkerClient({
    fallbackDebug: () => ({
      current: async () => ({ active: true, index: 0 }),
      next: async () => ({ active: true, index: 1 }),
      stop: () => ({ active: false, index: 1 })
    })
  });
  const session = client.createDebugSession('codigo', {});

  assert.equal((await session.current()).index, 0);
  assert.equal((await session.next()).index, 1);
  assert.equal((await session.stop()).active, false);
});

test('worker client bridges file read requests to onReadFile handlers', async () => {
  let runRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.RUN_START) {
        runRequestId = message.id;
        assert.equal(message.payload.options.__useWorkerFileReadBridge, true);
        assert.equal('onReadFile' in message.payload.options, false);
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.FILE_READ_REQUEST,
              id: 'file-read-1',
              payload: {
                requestId: message.id,
                filePath: 'teste.txt'
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.FILE_READ_RESPONSE);
      assert.equal(message.id, 'file-read-1');
      assert.equal(message.payload.value, 'conteudo');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: runRequestId,
            payload: { output: ['conteudo'] }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({ worker });

  const result = await client.run('codigo', {
    onReadFile: async (filePath) => `${filePath === 'teste.txt' ? 'conteudo' : ''}`
  });

  assert.deepEqual(result.output, ['conteudo']);
});

test('worker client bridges debug file read requests to onReadFile handlers', async () => {
  let debugRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.DEBUG_START) {
        debugRequestId = message.id;
        assert.equal(message.payload.options.__useWorkerFileReadBridge, true);
        assert.equal('onReadFile' in message.payload.options, false);
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.FILE_READ_REQUEST,
              id: 'debug-file-read-1',
              payload: {
                requestId: message.id,
                filePath: 'teste.txt'
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.FILE_READ_RESPONSE);
      assert.equal(message.id, 'debug-file-read-1');
      assert.equal(message.payload.value, 'conteudo');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: debugRequestId,
            payload: {
              sessionId: 's1',
              snapshot: {
                active: true,
                index: 0,
                total: 1,
                step: { line: 1, output: ['conteudo'] }
              }
            }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({
    worker,
    fallbackDebug: () => {
      throw new Error('debug fallback should not run');
    }
  });

  const session = client.createDebugSession('codigo', {
    onReadFile: async (filePath) => `${filePath === 'teste.txt' ? 'conteudo' : ''}`
  });

  assert.deepEqual((await session.current()).step.output, ['conteudo']);
});

test('worker client keeps debug file read handlers after the initial snapshot', async () => {
  let debugRequestId = null;
  let nextRequestId = null;
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.DEBUG_START) {
        debugRequestId = message.id;
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.RESPONSE_SUCCESS,
              id: message.id,
              payload: {
                sessionId: 's1',
                snapshot: {
                  active: true,
                  index: 0,
                  total: 2,
                  step: { line: 1, output: [] }
                }
              }
            }
          });
        });
        return;
      }

      if (message.type === WORKER_MESSAGE.DEBUG_NEXT) {
        nextRequestId = message.id;
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.FILE_READ_REQUEST,
              id: 'debug-file-read-after-start',
              payload: {
                requestId: debugRequestId,
                filePath: 'teste.txt'
              }
            }
          });
        });
        return;
      }

      assert.equal(message.type, WORKER_MESSAGE.FILE_READ_RESPONSE);
      assert.equal(message.id, 'debug-file-read-after-start');
      assert.equal(message.payload.value, 'conteudo');
      queueMicrotask(() => {
        worker.onmessage({
          data: {
            type: WORKER_MESSAGE.RESPONSE_SUCCESS,
            id: nextRequestId,
            payload: {
              snapshot: {
                active: true,
                index: 1,
                total: 2,
                step: { line: 2, output: ['conteudo'] }
              }
            }
          }
        });
      });
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({ worker });
  const session = client.createDebugSession('codigo', {
    onReadFile: async (filePath) => `${filePath === 'teste.txt' ? 'conteudo' : ''}`
  });

  assert.equal((await session.current()).index, 0);
  assert.deepEqual((await session.next()).step.output, ['conteudo']);
});

test('worker client bridges multiple consecutive read requests to onRead handlers', async () => {
  let runRequestId = null;
  const readRequestsCount = [];
  const worker = {
    postMessage(message) {
      if (message.type === WORKER_MESSAGE.RUN_START) {
        runRequestId = message.id;
        assert.equal(message.payload.options.__useWorkerReadBridge, true);

        // Trigger first read request
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.READ_REQUEST,
              id: 'read-1',
              payload: {
                requestId: message.id,
                request: { name: 'nome' }
              }
            }
          });
        });
        return;
      }

      if (message.type === WORKER_MESSAGE.READ_RESPONSE && message.id === 'read-1') {
        assert.equal(message.payload.value, 'Bia');
        // Trigger second read request
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.READ_REQUEST,
              id: 'read-2',
              payload: {
                requestId: runRequestId,
                request: { name: 'idade' }
              }
            }
          });
        });
        return;
      }

      if (message.type === WORKER_MESSAGE.READ_RESPONSE && message.id === 'read-2') {
        assert.equal(message.payload.value, '20');
        // Resolve successfully
        queueMicrotask(() => {
          worker.onmessage({
            data: {
              type: WORKER_MESSAGE.RESPONSE_SUCCESS,
              id: runRequestId,
              payload: { output: ['Bia', '20'] }
            }
          });
        });
      }
    },
    terminate() {}
  };
  const client = createInterpreterWorkerClient({ worker });

  const inputs = ['Bia', '20'];
  const result = await client.run('codigo', {
    onRead: async (request) => {
      readRequestsCount.push(request.name);
      return inputs.shift();
    }
  });

  assert.deepEqual(result.output, ['Bia', '20']);
  assert.deepEqual(readRequestsCount, ['nome', 'idade']);
});
