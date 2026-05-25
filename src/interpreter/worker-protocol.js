export const WORKER_MESSAGE = Object.freeze({
  RUN_START: 'run:start',
  DEBUG_START: 'debug:start',
  DEBUG_NEXT: 'debug:next',
  DEBUG_PREVIOUS: 'debug:previous',
  DEBUG_CONTINUE: 'debug:continue',
  DEBUG_NEXT_BREAKPOINT: 'debug:next-breakpoint',
  DEBUG_PREVIOUS_BREAKPOINT: 'debug:previous-breakpoint',
  DEBUG_STOP: 'debug:stop',
  READ_REQUEST: 'read:request',
  READ_RESPONSE: 'read:response',
  FILE_READ_REQUEST: 'file:read-request',
  FILE_READ_RESPONSE: 'file:read-response',
  WATCH_EVALUATE: 'watch:evaluate',
  RESPONSE_SUCCESS: 'response:success',
  RESPONSE_ERROR: 'response:error'
});

let nextRequestId = 0;

export function createWorkerRequest(type, payload = {}) {
  nextRequestId += 1;
  return { type, id: String(nextRequestId), payload };
}

export function createWorkerSuccess(id, payload = {}) {
  return { type: WORKER_MESSAGE.RESPONSE_SUCCESS, id, payload };
}

export function createWorkerError(id, error) {
  return {
    type: WORKER_MESSAGE.RESPONSE_ERROR,
    id,
    error: { message: error?.message ?? String(error) }
  };
}

export function isWorkerResponse(message) {
  return message?.type === WORKER_MESSAGE.RESPONSE_SUCCESS
    || message?.type === WORKER_MESSAGE.RESPONSE_ERROR;
}
