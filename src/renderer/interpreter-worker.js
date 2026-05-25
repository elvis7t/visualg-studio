import { createInteractiveDebugSession, runVisualg } from '../interpreter/index.js';
import {
  createWorkerError,
  createWorkerSuccess,
  WORKER_MESSAGE
} from '../interpreter/worker-protocol.js';

const debugSessions = new Map();
const pendingReads = new Map();
let nextDebugSessionId = 0;
let nextReadId = 0;

export async function handleWorkerMessage(message, { postMessage = null } = {}) {
  try {
    if (message.type === WORKER_MESSAGE.READ_RESPONSE || message.type === WORKER_MESSAGE.FILE_READ_RESPONSE) {
      resolveReadResponse(message);
      return null;
    }
    if (message.type === WORKER_MESSAGE.RUN_START) {
      const result = await runVisualg(
        message.payload.source,
        createWorkerOptions(message.id, message.payload.options ?? {}, postMessage)
      );
      return createWorkerSuccess(message.id, result);
    }
    if (message.type === WORKER_MESSAGE.DEBUG_START) {
      return createWorkerSuccess(message.id, await startDebugSession(message.id, message.payload, postMessage));
    }
    if (message.type === WORKER_MESSAGE.DEBUG_NEXT) {
      return createWorkerSuccess(message.id, { snapshot: await getDebugSession(message.payload.sessionId).next() });
    }
    if (message.type === WORKER_MESSAGE.DEBUG_PREVIOUS) {
      return createWorkerSuccess(message.id, { snapshot: await getDebugSession(message.payload.sessionId).previous() });
    }
    if (message.type === WORKER_MESSAGE.DEBUG_CONTINUE) {
      return createWorkerSuccess(message.id, { snapshot: await getDebugSession(message.payload.sessionId).continueExecution() });
    }
    if (message.type === WORKER_MESSAGE.DEBUG_NEXT_BREAKPOINT) {
      return createWorkerSuccess(message.id, { snapshot: await getDebugSession(message.payload.sessionId).nextBreakpoint() });
    }
    if (message.type === WORKER_MESSAGE.DEBUG_PREVIOUS_BREAKPOINT) {
      return createWorkerSuccess(message.id, { snapshot: await getDebugSession(message.payload.sessionId).previousBreakpoint() });
    }
    if (message.type === WORKER_MESSAGE.DEBUG_STOP) {
      const session = getDebugSession(message.payload.sessionId);
      debugSessions.delete(message.payload.sessionId);
      return createWorkerSuccess(message.id, { snapshot: session.stop() });
    }
    throw new Error(`Mensagem de worker nao suportada: ${message.type}`);
  } catch (error) {
    return createWorkerError(message.id, error);
  }
}

async function startDebugSession(requestId, { source, options = {} }, postMessage) {
  nextDebugSessionId += 1;
  const sessionId = String(nextDebugSessionId);
  const session = createInteractiveDebugSession(source, createWorkerOptions(requestId, options, postMessage));
  debugSessions.set(sessionId, session);
  return { sessionId, snapshot: await session.current() };
}

function getDebugSession(sessionId) {
  const session = debugSessions.get(sessionId);
  if (!session) throw new Error(`Sessao de debug nao encontrada: ${sessionId}`);
  return session;
}

function createWorkerOptions(requestId, options, postMessage) {
  const result = { ...options };
  if (options.__useWorkerReadBridge) {
    delete result.__useWorkerReadBridge;
    result.onRead = (request) => requestReadValue(requestId, request, postMessage);
  }
  if (options.__useWorkerFileReadBridge) {
    delete result.__useWorkerFileReadBridge;
    result.onReadFile = (filePath) => requestReadFileValue(requestId, filePath, postMessage);
  }
  return result;
}

function requestReadValue(requestId, request, postMessage) {
  if (!postMessage) return '';

  nextReadId += 1;
  const readId = `read-${nextReadId}`;
  postMessage({
    type: WORKER_MESSAGE.READ_REQUEST,
    id: readId,
    payload: { requestId, request }
  });

  return new Promise((resolve, reject) => {
    pendingReads.set(readId, { resolve, reject });
  });
}

function requestReadFileValue(requestId, filePath, postMessage) {
  if (!postMessage) return '';

  nextReadId += 1;
  const readId = `fileread-${nextReadId}`;
  postMessage({
    type: WORKER_MESSAGE.FILE_READ_REQUEST,
    id: readId,
    payload: { requestId, filePath }
  });

  return new Promise((resolve, reject) => {
    pendingReads.set(readId, { resolve, reject });
  });
}

function resolveReadResponse(message) {
  const pending = pendingReads.get(message.id);
  if (!pending) return;

  pendingReads.delete(message.id);
  if (message.error) {
    pending.reject(new Error(message.error.message));
    return;
  }
  pending.resolve(String(message.payload?.value ?? ''));
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = async (event) => {
    const response = await handleWorkerMessage(event.data, { postMessage: self.postMessage.bind(self) });
    if (response) self.postMessage(response);
  };
}
