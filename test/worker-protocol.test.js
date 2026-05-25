import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWorkerError,
  createWorkerRequest,
  createWorkerSuccess,
  isWorkerResponse,
  WORKER_MESSAGE
} from '../src/interpreter/worker-protocol.js';

test('worker protocol creates run request and success response', () => {
  const request = createWorkerRequest(WORKER_MESSAGE.RUN_START, {
    source: 'algoritmo "A"\ninicio\nfimalgoritmo',
    options: { input: ['Ana'] }
  });

  assert.equal(request.type, 'run:start');
  assert.equal(typeof request.id, 'string');
  assert.equal(request.payload.options.input[0], 'Ana');

  const response = createWorkerSuccess(request.id, { output: ['ok'] });

  assert.equal(response.type, 'response:success');
  assert.equal(response.id, request.id);
  assert.deepEqual(response.payload.output, ['ok']);
  assert.equal(isWorkerResponse(response), true);
});

test('worker protocol creates error response', () => {
  const response = createWorkerError('abc', new Error('Falhou'));

  assert.deepEqual(response, {
    type: 'response:error',
    id: 'abc',
    error: { message: 'Falhou' }
  });
  assert.equal(isWorkerResponse(response), true);
});

test('worker protocol exposes debug command names', () => {
  assert.equal(WORKER_MESSAGE.DEBUG_START, 'debug:start');
  assert.equal(WORKER_MESSAGE.DEBUG_NEXT, 'debug:next');
  assert.equal(WORKER_MESSAGE.DEBUG_PREVIOUS, 'debug:previous');
  assert.equal(WORKER_MESSAGE.DEBUG_CONTINUE, 'debug:continue');
  assert.equal(WORKER_MESSAGE.DEBUG_NEXT_BREAKPOINT, 'debug:next-breakpoint');
  assert.equal(WORKER_MESSAGE.DEBUG_PREVIOUS_BREAKPOINT, 'debug:previous-breakpoint');
  assert.equal(WORKER_MESSAGE.DEBUG_STOP, 'debug:stop');
});
