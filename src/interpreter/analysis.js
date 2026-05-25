import { parseVisualg } from './parser.js';

export function collectReadVariables(source) {
  const ast = parseVisualg(source);
  return collectReadsFromStatements(ast.statements);
}

function collectReadsFromStatements(statements) {
  const reads = [];

  for (const statement of statements) {
    if (statement.type === 'read') reads.push(...statement.names);
    if (statement.type === 'if') {
      reads.push(...collectReadsFromStatements(statement.thenStatements));
      reads.push(...collectReadsFromStatements(statement.elseStatements));
    }
    if (statement.type === 'for' || statement.type === 'while' || statement.type === 'repeat') {
      reads.push(...collectReadsFromStatements(statement.statements));
    }
    if (statement.type === 'choice') {
      for (const caseItem of statement.cases) {
        reads.push(...collectReadsFromStatements(caseItem.statements));
      }
      reads.push(...collectReadsFromStatements(statement.defaultStatements));
    }
  }

  return reads;
}
