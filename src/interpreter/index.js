import { parseVisualg } from './parser.js';
import { evaluateSnapshotExpression, executeAst } from './runtime.js';
import {
  createHeadlessDebugSession,
  createInteractiveSession
} from './debug-session.js';
export { collectReadVariables } from './analysis.js';
export {
  analyzeAstMetrics,
  analyzeVisualgMetrics,
  calculateCyclomaticComplexity
} from './metrics.js';

export async function runVisualg(source, options = {}) {
  const ast = parseVisualg(source);
  return executeAst(ast, options);
}

export async function debugVisualg(source, options = {}) {
  const ast = parseVisualg(source);
  return executeAst(ast, { ...options, debug: true });
}

/**
 * @deprecated API headless baseada em trace completo. A interface desktop usa
 * createInteractiveDebugSession para depuração pausável e entrada sob demanda.
 * Mantida para testes, automações e compatibilidade interna.
 */
export async function createDebugSession(source, options = {}) {
  return createHeadlessDebugSession(source, options, debugVisualg);
}

export function createInteractiveDebugSession(source, options = {}) {
  return createInteractiveSession(source, options, debugVisualg);
}

export function evaluateWatchExpression(snapshot, expression) {
  return evaluateSnapshotExpression(snapshot, expression);
}
