import assert from 'node:assert/strict';
import test from 'node:test';

import { WORKER_MESSAGE } from '../src/interpreter/worker-protocol.js';
import { handleWorkerMessage } from '../src/renderer/interpreter-worker.js';

test('worker handler executes run:start messages', async () => {
  const response = await handleWorkerMessage({
    type: WORKER_MESSAGE.RUN_START,
    id: '1',
    payload: {
      source: 'algoritmo "A"\ninicio\nescreval("ok")\nfimalgoritmo',
      options: {}
    }
  });

  assert.equal(response.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.deepEqual(response.payload.output, ['ok']);
});

test('worker handler returns error response for unsupported messages', async () => {
  const response = await handleWorkerMessage({
    type: 'unknown',
    id: '2',
    payload: {}
  });

  assert.equal(response.type, WORKER_MESSAGE.RESPONSE_ERROR);
  assert.match(response.error.message, /Mensagem de worker nao suportada: unknown/);
});

test('worker handler manages an interactive debug session', async () => {
  const start = await handleWorkerMessage({
    type: WORKER_MESSAGE.DEBUG_START,
    id: 'debug-1',
    payload: {
      source: 'algoritmo "A"\nvar\nx: inteiro\ninicio\nx <- 1\nx <- x + 1\nfimalgoritmo',
      options: { breakpoints: [5] }
    }
  });

  assert.equal(start.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.equal(start.payload.snapshot.step.line, 5);
  assert.equal(typeof start.payload.sessionId, 'string');

  const next = await handleWorkerMessage({
    type: WORKER_MESSAGE.DEBUG_NEXT,
    id: 'debug-2',
    payload: { sessionId: start.payload.sessionId }
  });

  assert.equal(next.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.ok(next.payload.snapshot.index >= start.payload.snapshot.index);

  const stopped = await handleWorkerMessage({
    type: WORKER_MESSAGE.DEBUG_STOP,
    id: 'debug-3',
    payload: { sessionId: start.payload.sessionId }
  });

  assert.equal(stopped.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.equal(stopped.payload.snapshot.active, false);
});

test('worker handler requests leia input through read bridge', async () => {
  const readRequests = [];
  const runPromise = handleWorkerMessage({
    type: WORKER_MESSAGE.RUN_START,
    id: 'run-read',
    payload: {
      source: 'algoritmo "A"\nvar\nnome: caracter\ninicio\nleia(nome)\nescreval(nome)\nfimalgoritmo',
      options: { __useWorkerReadBridge: true }
    }
  }, {
    postMessage(message) {
      readRequests.push(message);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(readRequests.length, 1);
  assert.equal(readRequests[0].type, WORKER_MESSAGE.READ_REQUEST);
  assert.equal(readRequests[0].payload.requestId, 'run-read');
  assert.equal(readRequests[0].payload.request.name, 'nome');

  await handleWorkerMessage({
    type: WORKER_MESSAGE.READ_RESPONSE,
    id: readRequests[0].id,
    payload: { value: 'Ana' }
  });

  const response = await runPromise;
  assert.equal(response.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.deepEqual(response.payload.output, ['Ana']);
});

test('worker handler requests file read through file read bridge', async () => {
  const fileReadRequests = [];
  const runPromise = handleWorkerMessage({
    type: WORKER_MESSAGE.RUN_START,
    id: 'run-file-read',
    payload: {
      source: 'algoritmo "A"\nvar\nn: inteiro\ninicio\narquivo "entradas.txt"\nleia(n)\nescreval(n)\nfimalgoritmo',
      options: { __useWorkerFileReadBridge: true }
    }
  }, {
    postMessage(message) {
      fileReadRequests.push(message);
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(fileReadRequests.length, 1);
  assert.equal(fileReadRequests[0].type, WORKER_MESSAGE.FILE_READ_REQUEST);
  assert.equal(fileReadRequests[0].payload.requestId, 'run-file-read');
  assert.equal(fileReadRequests[0].payload.filePath, 'entradas.txt');

  await handleWorkerMessage({
    type: WORKER_MESSAGE.FILE_READ_RESPONSE,
    id: fileReadRequests[0].id,
    payload: { value: '123' }
  });

  const response = await runPromise;
  assert.equal(response.type, WORKER_MESSAGE.RESPONSE_SUCCESS);
  assert.deepEqual(response.payload.output, ['123']);
});
