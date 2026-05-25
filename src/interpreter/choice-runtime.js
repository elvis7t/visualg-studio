export async function findSelectedChoiceCase(runtime, value, cases) {
  for (const caseItem of cases) {
    for (const expression of caseItem.expressions) {
      if (await matchesChoiceExpression(runtime, value, expression)) return caseItem;
    }
  }
  return null;
}

async function matchesChoiceExpression(runtime, value, expression) {
  const range = expression.match(/^(.+?)\s*\.\.\s*(.+)$/);
  if (!range) return await runtime.evaluate(expression) === value;

  const start = await runtime.evaluate(range[1].trim());
  const end = await runtime.evaluate(range[2].trim());
  return value >= start && value <= end;
}
