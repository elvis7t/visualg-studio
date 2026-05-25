# Interpreter Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Visualg execution out of the renderer UI thread using a Web Worker while preserving the current interpreter API and debugger behavior.

**Status:** Implemented. Normal execution and interactive debugging now use the Worker client when available. `leia(...)` is bridged through `read:request/read:response`, including debug sessions after the initial snapshot. Direct interpreter calls remain as fallback for unsupported environments or non-cloneable options.

**Architecture:** Add a small message protocol shared by renderer and worker. Start with normal execution (`run`) only, then migrate the interactive debugger once the worker bridge is verified. Keep direct interpreter calls available as a fallback during the transition.

**Tech Stack:** Electron renderer, Web Worker module, ES modules, Node `node:test`, existing interpreter modules under `src/interpreter/`.

---

## File Structure

- Create: `src/interpreter/worker-protocol.js`
  Defines message type constants, request builders, response builders and validation helpers.
- Create: `test/worker-protocol.test.js`
  Tests protocol shape without Electron or browser APIs.
- Create: `src/renderer/interpreter-worker.js`
  Worker entrypoint. Imports interpreter API and translates worker messages to interpreter calls.
- Create: `src/renderer/worker-client.js`
  Renderer-side client with request ids, pending promises and fallback support.
- Modify: `src/renderer/app.js`
  Replace direct execution path with worker client for normal run only.
- Later modify: `src/renderer/debug-controller.js` or current debug orchestration file
  Move interactive debugger commands to the worker after normal run is stable.

---

### Task 1: Worker Protocol

**Files:**
- Create: `src/interpreter/worker-protocol.js`
- Create: `test/worker-protocol.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- test/worker-protocol.test.js
```

Expected: fail with module not found for `worker-protocol.js`.

- [ ] **Step 3: Implement protocol**

```js
export const WORKER_MESSAGE = Object.freeze({
  RUN_START: 'run:start',
  DEBUG_START: 'debug:start',
  DEBUG_NEXT: 'debug:next',
  DEBUG_PREVIOUS: 'debug:previous',
  DEBUG_CONTINUE: 'debug:continue',
  DEBUG_STOP: 'debug:stop',
  READ_REQUEST: 'read:request',
  READ_RESPONSE: 'read:response',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- test/worker-protocol.test.js
```

Expected: pass.

---

### Task 2: Worker Entry for Normal Execution

**Files:**
- Create: `src/renderer/interpreter-worker.js`
- Create: `test/worker-entry.test.js`

- [ ] **Step 1: Write the failing test for worker handler**

Prefer extracting the handler so it can be tested without browser Worker globals:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleWorkerMessage } from '../src/renderer/interpreter-worker.js';
import { WORKER_MESSAGE } from '../src/interpreter/worker-protocol.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- test/worker-entry.test.js
```

Expected: fail with module not found for `interpreter-worker.js`.

- [ ] **Step 3: Implement worker handler**

```js
import { runVisualg } from '../interpreter/index.js';
import {
  createWorkerError,
  createWorkerSuccess,
  WORKER_MESSAGE
} from '../interpreter/worker-protocol.js';

export async function handleWorkerMessage(message) {
  try {
    if (message.type === WORKER_MESSAGE.RUN_START) {
      const result = await runVisualg(message.payload.source, message.payload.options ?? {});
      return createWorkerSuccess(message.id, result);
    }
    throw new Error(`Mensagem de worker nao suportada: ${message.type}`);
  } catch (error) {
    return createWorkerError(message.id, error);
  }
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = async (event) => {
    self.postMessage(await handleWorkerMessage(event.data));
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- test/worker-entry.test.js
```

Expected: pass.

---

### Task 3: Renderer Worker Client with Fallback

**Files:**
- Create: `src/renderer/worker-client.js`
- Create: `test/worker-client.test.js`

- [ ] **Step 1: Write failing test with a fake Worker**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { createInterpreterWorkerClient } from '../src/renderer/worker-client.js';
import { WORKER_MESSAGE } from '../src/interpreter/worker-protocol.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- test/worker-client.test.js
```

Expected: fail with module not found for `worker-client.js`.

- [ ] **Step 3: Implement client**

```js
import {
  createWorkerRequest,
  WORKER_MESSAGE
} from '../interpreter/worker-protocol.js';

export function createInterpreterWorkerClient({ worker, fallbackRun } = {}) {
  const pending = new Map();

  if (worker) {
    worker.onmessage = (event) => {
      const message = event.data;
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      if (message.type === WORKER_MESSAGE.RESPONSE_ERROR) {
        entry.reject(new Error(message.error.message));
        return;
      }
      entry.resolve(message.payload);
    };
  }

  function request(type, payload) {
    if (!worker) {
      if (type === WORKER_MESSAGE.RUN_START && fallbackRun) {
        return fallbackRun(payload.source, payload.options ?? {});
      }
      return Promise.reject(new Error('Worker do interpretador indisponivel.'));
    }

    const message = createWorkerRequest(type, payload);
    const promise = new Promise((resolve, reject) => {
      pending.set(message.id, { resolve, reject });
    });
    worker.postMessage(message);
    return promise;
  }

  return {
    run(source, options = {}) {
      return request(WORKER_MESSAGE.RUN_START, { source, options });
    },
    dispose() {
      worker?.terminate?.();
      pending.clear();
    }
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm test -- test/worker-client.test.js
```

Expected: pass.

---

### Task 4: Wire Normal Execution in UI

**Files:**
- Modify: `src/renderer/app.js`
- Possibly modify: current renderer controller that imports `runVisualg`

- [ ] **Step 1: Locate direct run call**

Run:

```powershell
Select-String -Path .\src\renderer\*.js -Pattern "runVisualg|debugVisualg|createInteractiveDebugSession"
```

Expected: identify where normal execution starts.

- [ ] **Step 2: Create worker client in renderer startup**

Use this pattern:

```js
import { runVisualg } from '../interpreter/index.js';
import { createInterpreterWorkerClient } from './worker-client.js';

const interpreterClient = createInterpreterWorkerClient({
  worker: typeof Worker === 'function'
    ? new Worker(new URL('./interpreter-worker.js', import.meta.url), { type: 'module' })
    : null,
  fallbackRun: runVisualg
});
```

- [ ] **Step 3: Replace normal execution call only**

Change:

```js
const result = await runVisualg(source, options);
```

To:

```js
const result = await interpreterClient.run(source, options);
```

Do not move debug yet in this task.

- [ ] **Step 4: Build renderer**

Run:

```powershell
npm run build:renderer
```

Expected: esbuild succeeds and includes the worker module.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run verify
```

Expected: all tests and syntax check pass.

---

### Task 5: Move Interactive Debug After Normal Run Stabilizes

**Files:**
- Modify: `src/renderer/interpreter-worker.js`
- Modify: `src/renderer/worker-client.js`
- Modify: debug orchestration in `src/renderer/`
- Add tests for debug message sequencing.

- [ ] **Step 1: Add protocol tests for debug commands**

Extend `test/worker-protocol.test.js` with requests for `debug:start`, `debug:next`, `debug:continue`, `debug:stop`, `watch:evaluate`, `read:response`.

- [ ] **Step 2: Add worker-side session map**

Inside `interpreter-worker.js`, keep one active debug session per request/session id:

```js
const debugSessions = new Map();
```

- [ ] **Step 3: Implement `debug:start` only**

Start `createInteractiveDebugSession(source, options)`, store it and return `session.current()`.

- [ ] **Step 4: Implement navigation commands**

Map:

```text
debug:next      -> session.next()
debug:previous  -> session.previous()
debug:continue  -> session.continueExecution()
debug:stop      -> session.stop()
watch:evaluate  -> evaluateWatchExpression(snapshot, expression)
```

- [ ] **Step 5: Preserve current UI behavior**

The visible debug panel must stay the same: same step list, same variable table, same output section, same breakpoint buttons logic.

- [ ] **Step 6: Verify**

Run:

```powershell
npm run build:renderer
npm run verify
```

Expected: all tests pass and manual debug still pauses at breakpoints and `leia(...)`.
