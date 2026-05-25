import { parseVisualg } from './parser.js';

const LOOP_TYPES = new Set(['for', 'while', 'repeat']);
const SIMPLE_BLOCK_TYPES = new Set(['if', 'for', 'while', 'repeat']);

export function analyzeVisualgMetrics(sourceOrAst, source = '') {
  const ast = typeof sourceOrAst === 'string' ? parseVisualg(sourceOrAst) : sourceOrAst;
  const originalSource = typeof sourceOrAst === 'string' ? sourceOrAst : source;
  return analyzeAstMetrics(ast, originalSource);
}

export function analyzeAstMetrics(ast, source = '') {
  const recursiveSubprograms = findRecursiveSubprograms(ast);
  const annotation = findComplexityAnnotation(source);
  const maxLoopDepth = Math.max(
    maxLoopNesting(ast.statements),
    ...(ast.subprograms ?? []).map((subprogram) => maxLoopNesting(subprogram.statements))
  );

  return {
    cyclomaticComplexity: calculateCyclomaticComplexity(ast),
    bigO: {
      value: annotation ?? estimateBigO({ maxLoopDepth, recursive: recursiveSubprograms.length > 0 }),
      source: annotation ? 'annotation' : 'estimated',
      maxLoopDepth,
      recursive: recursiveSubprograms.length > 0,
      recursiveSubprograms
    }
  };
}

export function calculateCyclomaticComplexity(ast) {
  return 1 + countDecisionPoints(ast.statements) + (ast.subprograms ?? []).reduce(
    (total, subprogram) => total + countDecisionPoints(subprogram.statements),
    0
  );
}

function countDecisionPoints(statements = []) {
  return statements.reduce((total, statement) => {
    if (SIMPLE_BLOCK_TYPES.has(statement.type)) {
      return total + 1 + countNestedDecisionPoints(statement);
    }

    if (statement.type === 'choice') {
      return total
        + (statement.cases?.length ?? 0)
        + (statement.cases ?? []).reduce((sum, item) => sum + countDecisionPoints(item.statements), 0)
        + countDecisionPoints(statement.defaultStatements);
    }

    return total;
  }, 0);
}

function countNestedDecisionPoints(statement) {
  if (statement.type === 'if') {
    return countDecisionPoints(statement.thenStatements) + countDecisionPoints(statement.elseStatements);
  }
  return countDecisionPoints(statement.statements);
}

function maxLoopNesting(statements = [], currentDepth = 0) {
  return statements.reduce((maxDepth, statement) => {
    if (LOOP_TYPES.has(statement.type)) {
      return Math.max(maxDepth, maxLoopNesting(statement.statements, currentDepth + 1));
    }

    if (statement.type === 'if') {
      return Math.max(
        maxDepth,
        maxLoopNesting(statement.thenStatements, currentDepth),
        maxLoopNesting(statement.elseStatements, currentDepth)
      );
    }

    if (statement.type === 'choice') {
      return Math.max(
        maxDepth,
        ...(statement.cases ?? []).map((item) => maxLoopNesting(item.statements, currentDepth)),
        maxLoopNesting(statement.defaultStatements, currentDepth)
      );
    }

    return maxDepth;
  }, currentDepth);
}

function estimateBigO({ maxLoopDepth, recursive }) {
  if (recursive) return '~O(2^n)';
  if (maxLoopDepth <= 0) return '~O(1)';
  if (maxLoopDepth === 1) return '~O(n)';
  if (maxLoopDepth === 2) return '~O(n²)';
  if (maxLoopDepth === 3) return '~O(n³)';
  return `~O(n^${maxLoopDepth})`;
}

function findComplexityAnnotation(source) {
  return source.match(/\/\/\s*@complexidade\s+(.+)$/im)?.[1].trim() ?? null;
}

function findRecursiveSubprograms(ast) {
  return (ast.subprograms ?? [])
    .filter((subprogram) => statementsContainCall(subprogram.statements, subprogram.name))
    .map((subprogram) => subprogram.name);
}

function statementsContainCall(statements = [], name) {
  return statements.some((statement) => statementContainsCall(statement, name));
}

function statementContainsCall(statement, name) {
  if (statement.type === 'procedureCall' && equalsName(statement.name, name)) return true;

  return Object.entries(statement).some(([key, value]) => {
    if (key === 'type' || key === 'line' || key === 'name') return false;
    return valueContainsCall(value, name);
  });
}

function valueContainsCall(value, name) {
  if (typeof value === 'string') return expressionContainsCall(value, name);
  if (Array.isArray(value)) {
    return value.some((item) => valueContainsCall(item, name));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => valueContainsCall(item, name));
  }
  return false;
}

function expressionContainsCall(expression, name) {
  return new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, 'i').test(expression);
}

function equalsName(left, right) {
  return String(left).toLowerCase() === String(right).toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
