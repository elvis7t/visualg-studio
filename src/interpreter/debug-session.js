export async function createHeadlessDebugSession(source, options, debugRunner) {
  const trace = await debugRunner(source, options);
  const breakpointIndexes = findBreakpointIndexes(trace.steps, options.breakpoints ?? []);
  const breakpointIndex = breakpointIndexes[0] ?? -1;
  let index = breakpointIndex >= 0 ? breakpointIndex : 0;
  let active = trace.steps.length > 0;

  function snapshot() {
    return {
      active,
      index,
      total: trace.steps.length,
      step: trace.steps[index] ?? null,
      hasBreakpoints: breakpointIndexes.length > 0,
      hasMultipleBreakpoints: breakpointIndexes.length > 1,
      breakpointCount: breakpointIndexes.length,
      output: trace.output
    };
  }

  return {
    current: snapshot,
    next() {
      if (index < trace.steps.length - 1) index += 1;
      return snapshot();
    },
    previous() {
      if (index > 0) index -= 1;
      return snapshot();
    },
    nextBreakpoint() {
      const nextIndex = breakpointIndexes.find((item) => item > index);
      if (nextIndex != null) index = nextIndex;
      return snapshot();
    },
    previousBreakpoint() {
      const previousIndex = breakpointIndexes.findLast((item) => item < index);
      if (previousIndex != null) index = previousIndex;
      return snapshot();
    },
    stop() {
      active = false;
      return snapshot();
    }
  };
}

export function createInteractiveSession(source, options, debugRunner) {
  const steps = [];
  let index = 0;
  let active = true;
  let done = false;
  let output = [];
  let error = null;
  let resumeExecution = null;
  let initialized = false;
  const waiters = [];
  const sortedBreakpoints = normalizeBreakpoints(options.breakpoints ?? []);

  const run = debugRunner(source, {
    ...options,
    async onDebugStep(step) {
      steps.push(step);
      index = steps.length - 1;
      notifyWaiters();
      await new Promise((resolve) => {
        resumeExecution = resolve;
      });
      resumeExecution = null;
    }
  }).then((trace) => {
    output = trace.output;
    done = true;
    active = false;
    notifyWaiters();
  }).catch((caught) => {
    error = caught;
    done = true;
    active = false;
    notifyWaiters();
  });
  run.catch(() => {});

  function snapshot() {
    const breakpointIndexes = findBreakpointIndexes(steps, sortedBreakpoints);
    return {
      active,
      index,
      total: steps.length,
      step: steps[index] ?? null,
      hasBreakpoints: breakpointIndexes.length > 0,
      hasMultipleBreakpoints: breakpointIndexes.length > 1,
      breakpointCount: breakpointIndexes.length,
      output
    };
  }

  function notifyWaiters() {
    for (const waiter of waiters.splice(0)) waiter();
  }

  async function waitForStepOrDone(previousLength = -1) {
    while (steps.length <= previousLength && !done) {
      await new Promise((resolve) => waiters.push(resolve));
    }
    if (error && steps.length <= previousLength) throw error;
  }

  async function advanceUntil(predicate) {
    do {
      if (index < steps.length - 1) {
        index += 1;
      } else {
        const previousLength = steps.length;
        resumeExecution?.();
        await waitForStepOrDone(previousLength);
        if (steps.length > previousLength) index = steps.length - 1;
      }
    } while (!done && steps[index] && !predicate(steps[index]));
    if (error && !steps[index]) throw error;
    return snapshot();
  }

  return {
    async current() {
      await waitForStepOrDone(0);
      if (!initialized) {
        initialized = true;
        if (sortedBreakpoints.length > 0) {
          if (!steps[index] || steps[index].line < sortedBreakpoints[0]) {
            await advanceUntil((step) => step.line >= sortedBreakpoints[0]);
          }
        }
      }
      return snapshot();
    },
    async next() {
      return advanceUntil(() => true);
    },
    async previous() {
      if (index > 0) index -= 1;
      return snapshot();
    },
    async nextBreakpoint() {
      const breakpointIndexes = findBreakpointIndexes(steps, sortedBreakpoints);
      const nextIndex = breakpointIndexes.find((item) => item > index);
      if (nextIndex != null) {
        index = nextIndex;
        return snapshot();
      }

      const nextBreakpoint = sortedBreakpoints.find((line) => line > (steps[index]?.line ?? 0));
      if (nextBreakpoint == null) return snapshot();
      return advanceUntil((step) => step.line >= nextBreakpoint);
    },
    async continueExecution() {
      const currentLine = steps[index]?.line ?? 0;
      const nextBreakpoint = sortedBreakpoints.find((line) => line > currentLine);
      if (nextBreakpoint == null) {
        return advanceUntil(() => false);
      }
      return advanceUntil((step) => step.line >= nextBreakpoint);
    },
    async previousBreakpoint() {
      const breakpointIndexes = findBreakpointIndexes(steps, sortedBreakpoints);
      const previousIndex = breakpointIndexes.findLast((item) => item < index);
      if (previousIndex != null) index = previousIndex;
      return snapshot();
    },
    stop() {
      active = false;
      done = true;
      resumeExecution?.();
      notifyWaiters();
      return snapshot();
    }
  };
}

export function findBreakpointIndexes(steps, breakpoints) {
  const sortedBreakpoints = normalizeBreakpoints(breakpoints);
  if (sortedBreakpoints.length === 0) return [];

  const indexes = [];

  for (const breakpoint of sortedBreakpoints) {
    const index = steps.findIndex((step) => step.line >= breakpoint);
    if (index >= 0 && !indexes.includes(index)) indexes.push(index);
  }

  return indexes;
}

function normalizeBreakpoints(breakpoints) {
  return [...new Set(breakpoints.map(Number))]
    .filter((line) => Number.isInteger(line) && line > 0)
    .sort((a, b) => a - b);
}
