import {
  createWorkerRequest,
  WORKER_MESSAGE
} from '../interpreter/worker-protocol.js';

export function createInterpreterWorkerClient({ worker = null, fallbackRun = null, fallbackDebug = null } = {}) {
  const pending = new Map();
  const readHandlers = new Map();
  const fileReadHandlers = new Map();
  const debugReadHandlerIds = new Map();
  const debugFileReadHandlerIds = new Map();

  if (worker) {
    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === WORKER_MESSAGE.READ_REQUEST) {
        handleReadRequest(worker, readHandlers, message);
        return;
      }
      if (message.type === WORKER_MESSAGE.FILE_READ_REQUEST) {
        handleFileReadRequest(worker, fileReadHandlers, message);
        return;
      }

      const entry = pending.get(message.id);
      if (!entry) return;

      pending.delete(message.id);
      cleanupReadHandlerForResponse(entry, message, readHandlers, debugReadHandlerIds, fileReadHandlers, debugFileReadHandlerIds);
      if (message.type === WORKER_MESSAGE.RESPONSE_ERROR) {
        entry.reject(new Error(message.error.message));
        return;
      }
      entry.resolve(message.payload);
    };
  }

  function request(type, payload) {
    const readHandler = getReadHandler(type, payload);
    const fileReadHandler = getFileReadHandler(type, payload);
    const workerPayload = (readHandler || fileReadHandler) ? createReadBridgePayload(payload) : payload;

    if (!worker || cannotPostMessage(workerPayload)) {
      if (type === WORKER_MESSAGE.RUN_START && fallbackRun) {
        return fallbackRun(payload.source, payload.options ?? {});
      }
      return Promise.reject(new Error('Worker do interpretador indisponivel.'));
    }

    const message = createWorkerRequest(type, workerPayload);
    const promise = new Promise((resolve, reject) => {
      pending.set(message.id, { resolve, reject, type, readHandler, fileReadHandler, sessionId: payload.sessionId });
      if (readHandler) readHandlers.set(message.id, readHandler);
      if (fileReadHandler) fileReadHandlers.set(message.id, fileReadHandler);
    });
    worker.postMessage(message);
    return promise;
  }

  return {
    run(source, options = {}) {
      return request(WORKER_MESSAGE.RUN_START, { source, options });
    },
    createDebugSession(source, options = {}) {
      if (!worker || cannotPostMessage(createWorkerPayload(WORKER_MESSAGE.DEBUG_START, { source, options }))) {
        if (fallbackDebug) return fallbackDebug(source, options);
      }
      return createWorkerDebugSession((type, payload = {}) => request(type, payload), source, options);
    },
    dispose() {
      worker?.terminate?.();
      pending.clear();
      readHandlers.clear();
      fileReadHandlers.clear();
      debugReadHandlerIds.clear();
      debugFileReadHandlerIds.clear();
    }
  };
}

function createWorkerPayload(type, payload) {
  return (getReadHandler(type, payload) || getFileReadHandler(type, payload)) ? createReadBridgePayload(payload) : payload;
}

function getReadHandler(type, payload) {
  if (![WORKER_MESSAGE.RUN_START, WORKER_MESSAGE.DEBUG_START].includes(type)) return null;
  return typeof payload.options?.onRead === 'function' ? payload.options.onRead : null;
}

function getFileReadHandler(type, payload) {
  if (![WORKER_MESSAGE.RUN_START, WORKER_MESSAGE.DEBUG_START].includes(type)) return null;
  return typeof payload.options?.onReadFile === 'function' ? payload.options.onReadFile : null;
}

function createReadBridgePayload(payload) {
  const { onRead, onReadFile, ...options } = payload.options ?? {};
  const result = {
    ...payload,
    options: {
      ...options
    }
  };
  if (onRead) result.options.__useWorkerReadBridge = true;
  if (onReadFile) result.options.__useWorkerFileReadBridge = true;
  return result;
}

function cleanupRunStart(message, readHandlers, fileReadHandlers) {
  readHandlers.delete(message.id);
  fileReadHandlers?.delete(message.id);
}

function cleanupDebugStart(entry, message, readHandlers, fileReadHandlers, debugReadHandlerIds, debugFileReadHandlerIds) {
  if (message.type === WORKER_MESSAGE.RESPONSE_ERROR) {
    readHandlers.delete(message.id);
    fileReadHandlers?.delete(message.id);
    return;
  }
  const sessionId = message.payload?.sessionId;
  if (sessionId) {
    if (entry.readHandler) debugReadHandlerIds.set(sessionId, message.id);
    if (entry.fileReadHandler) debugFileReadHandlerIds.set(sessionId, message.id);
  }
}

function cleanupDebugStop(entry, readHandlers, fileReadHandlers, debugReadHandlerIds, debugFileReadHandlerIds) {
  if (!entry.sessionId) return;
  const readHandlerId = debugReadHandlerIds.get(entry.sessionId);
  if (readHandlerId) {
    readHandlers.delete(readHandlerId);
  }
  debugReadHandlerIds.delete(entry.sessionId);

  const fileReadHandlerId = debugFileReadHandlerIds.get(entry.sessionId);
  if (fileReadHandlerId) {
    fileReadHandlers?.delete(fileReadHandlerId);
  }
  debugFileReadHandlerIds.delete(entry.sessionId);
}

function cleanupReadHandlerForResponse(
  entry,
  message,
  readHandlers,
  debugReadHandlerIds,
  fileReadHandlers,
  debugFileReadHandlerIds
) {
  if (entry.type === WORKER_MESSAGE.RUN_START) {
    cleanupRunStart(message, readHandlers, fileReadHandlers);
  } else if (entry.type === WORKER_MESSAGE.DEBUG_START) {
    cleanupDebugStart(entry, message, readHandlers, fileReadHandlers, debugReadHandlerIds, debugFileReadHandlerIds);
  } else if (entry.type === WORKER_MESSAGE.DEBUG_STOP) {
    cleanupDebugStop(entry, readHandlers, fileReadHandlers, debugReadHandlerIds, debugFileReadHandlerIds);
  }
}

async function handleReadRequest(worker, readHandlers, message) {
  const handler = readHandlers.get(message.payload?.requestId);
  if (!handler) {
    worker.postMessage({
      type: WORKER_MESSAGE.READ_RESPONSE,
      id: message.id,
      error: { message: `Leitor nao encontrado para ${message.payload?.requestId}.` }
    });
    return;
  }

  try {
    worker.postMessage({
      type: WORKER_MESSAGE.READ_RESPONSE,
      id: message.id,
      payload: { value: await handler(message.payload.request) }
    });
  } catch (error) {
    worker.postMessage({
      type: WORKER_MESSAGE.READ_RESPONSE,
      id: message.id,
      error: { message: error.message }
    });
  }
}

async function handleFileReadRequest(worker, fileReadHandlers, message) {
  const handler = fileReadHandlers.get(message.payload?.requestId);
  if (!handler) {
    worker.postMessage({
      type: WORKER_MESSAGE.FILE_READ_RESPONSE,
      id: message.id,
      error: { message: `Leitor de arquivo nao encontrado para ${message.payload?.requestId}.` }
    });
    return;
  }

  try {
    worker.postMessage({
      type: WORKER_MESSAGE.FILE_READ_RESPONSE,
      id: message.id,
      payload: { value: await handler(message.payload.filePath) }
    });
  } catch (error) {
    worker.postMessage({
      type: WORKER_MESSAGE.FILE_READ_RESPONSE,
      id: message.id,
      error: { message: error.message }
    });
  }
}

function cannotPostMessage(value) {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;

  if (Array.isArray(value)) return value.some(cannotPostMessage);
  return Object.values(value).some(cannotPostMessage);
}

function createWorkerDebugSession(request, source, options) {
  let sessionId = null;
  let currentSnapshotPromise = request(WORKER_MESSAGE.DEBUG_START, { source, options }).then((payload) => {
    sessionId = payload.sessionId;
    return payload.snapshot;
  });

  async function debugRequest(type) {
    await currentSnapshotPromise;
    currentSnapshotPromise = request(type, { sessionId }).then((payload) => payload.snapshot);
    return currentSnapshotPromise;
  }

  return {
    current() {
      return currentSnapshotPromise;
    },
    next() {
      return debugRequest(WORKER_MESSAGE.DEBUG_NEXT);
    },
    previous() {
      return debugRequest(WORKER_MESSAGE.DEBUG_PREVIOUS);
    },
    continueExecution() {
      return debugRequest(WORKER_MESSAGE.DEBUG_CONTINUE);
    },
    previousBreakpoint() {
      return debugRequest(WORKER_MESSAGE.DEBUG_PREVIOUS_BREAKPOINT);
    },
    nextBreakpoint() {
      return debugRequest(WORKER_MESSAGE.DEBUG_NEXT_BREAKPOINT);
    },
    stop() {
      return debugRequest(WORKER_MESSAGE.DEBUG_STOP);
    }
  };
}
