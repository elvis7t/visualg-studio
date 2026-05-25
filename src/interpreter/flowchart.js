import { parseVisualg } from "./parser.js";

export function createFlowchart(source) {
  const ast = parseVisualg(source);
  return createFlowchartFromAst(ast);
}

export function createFlowchartFromAst(ast) {
  const builder = createBuilder();
  const start = builder.addNode("terminal", "Início", null, 0);
  const first = appendStatements(builder, ast.statements, start, 1);
  const end = builder.addNode("terminal", "Fim", null, first.exitLevel);
  builder.addEdge(first.exit, end);
  return { nodes: builder.nodes, edges: builder.edges };
}

function appendStatements(builder, statements, entry, startLevel) {
  let current = entry;
  let currentLevel = startLevel;
  let first = null;
  for (const statement of statements) {
    const flow = appendStatement(builder, statement, current, currentLevel);
    first ??= flow.entry;
    current = flow.exit;
    currentLevel = flow.exitLevel;
  }
  return { first, exit: current, exitLevel: currentLevel };
}

function appendStatement(builder, statement, entry, currentLevel) {
  if (statement.type === "if") {
    return appendIf(builder, statement, entry, currentLevel);
  }

  if (statement.type === "for" || statement.type === "while" || statement.type === "repeat") {
    return appendLoop(builder, statement, entry, currentLevel);
  }

  if (statement.type === "choice") {
    return appendChoice(builder, statement, entry, currentLevel);
  }

  const node = builder.addNode(statementKind(statement), statementLabel(statement), statement.line, currentLevel);
  builder.addEdge(entry, node);
  return { entry: node, exit: node, exitLevel: currentLevel + 1 };
}

function appendIf(builder, statement, entry, currentLevel) {
  const decision = builder.addNode("decision", `${statement.condition}?`, statement.line, currentLevel);
  builder.addEdge(entry, decision);
  
  const thenFlow = statement.thenStatements.length
    ? appendStatements(builder, statement.thenStatements, decision, currentLevel + 1)
    : null;
  const elseFlow = statement.elseStatements.length
    ? appendStatements(builder, statement.elseStatements, decision, currentLevel + 1)
    : null;

  const thenExitLevel = thenFlow ? thenFlow.exitLevel : (currentLevel + 1);
  const elseExitLevel = elseFlow ? elseFlow.exitLevel : (currentLevel + 1);
  const joinLevel = Math.max(thenExitLevel, elseExitLevel);
  
  const join = builder.addNode("join", "fimse", null, joinLevel);

  if (thenFlow) {
    builder.labelEdge(decision, thenFlow.first, "sim");
    builder.addEdge(thenFlow.exit, join);
  } else {
    builder.addEdge(decision, join, "sim");
  }

  if (elseFlow) {
    builder.labelEdge(decision, elseFlow.first, "nao");
    builder.addEdge(elseFlow.exit, join);
  } else {
    builder.addEdge(decision, join, "nao");
  }

  return { entry: decision, exit: join, exitLevel: joinLevel + 1 };
}

function appendLoop(builder, statement, entry, currentLevel) {
  const loop = builder.addNode("loop", loopLabel(statement), statement.line, currentLevel);
  builder.addEdge(entry, loop);
  
  const bodyFlow = statement.statements.length
    ? appendStatements(builder, statement.statements, loop, currentLevel + 1)
    : null;
    
  const bodyExitLevel = bodyFlow ? bodyFlow.exitLevel : (currentLevel + 1);
  const after = builder.addNode("join", loopEndLabel(statement), null, bodyExitLevel);

  if (bodyFlow) {
    builder.labelEdge(loop, bodyFlow.first, "sim");
    builder.addEdge(bodyFlow.exit, loop);
  } else {
    builder.addEdge(loop, loop, "sim");
  }

  builder.addEdge(loop, after, "nao");
  return { entry: loop, exit: after, exitLevel: bodyExitLevel + 1 };
}

function appendChoice(builder, statement, entry, currentLevel) {
  const decision = builder.addNode("decision", `escolha ${statement.expression}`, statement.line, currentLevel);
  builder.addEdge(entry, decision);
  const exits = [];
  const exitLevels = [];

  for (const item of statement.cases) {
    const caseEntry = builder.addNode("case", `caso ${item.expressions.join(", ")}`, item.line, currentLevel + 1);
    builder.addEdge(decision, caseEntry);
    const flow = appendStatements(builder, item.statements, caseEntry, currentLevel + 2);
    exits.push(flow.exit);
    exitLevels.push(flow.exitLevel);
  }

  if (statement.defaultStatements.length) {
    const defaultEntry = builder.addNode("case", "outrocaso", null, currentLevel + 1);
    builder.addEdge(decision, defaultEntry);
    const flow = appendStatements(builder, statement.defaultStatements, defaultEntry, currentLevel + 2);
    exits.push(flow.exit);
    exitLevels.push(flow.exitLevel);
  }

  const joinLevel = exitLevels.length ? Math.max(...exitLevels) : (currentLevel + 1);
  const join = builder.addNode("join", "fimescolha", null, joinLevel);
  for (const exit of exits) builder.addEdge(exit, join);
  if (!statement.defaultStatements.length) builder.addEdge(decision, join);

  return { entry: decision, exit: join, exitLevel: joinLevel + 1 };
}

function statementKind(statement) {
  if (statement.type === "read") return "input";
  if (statement.type === "write" || statement.type === "writeLine") return "output";
  if (statement.type === "assign" || statement.type === "procedureCall" || statement.type === "return") return "process";
  return "process";
}

function statementLabel(statement) {
  switch (statement.type) {
    case "read":
      return `leia(${statement.names.join(", ")})`;
    case "write":
      return `escreva(${statement.args.join(", ")})`;
    case "writeLine":
      return `escreval(${statement.args.join(", ")})`;
    case "assign":
      return `${statement.target} <- ${statement.expression}`;
    case "procedureCall":
      return `${statement.name}(${statement.args.join(", ")})`;
    case "return":
      return `retorne ${statement.expression}`;
    case "break":
      return "interrompa";
    case "clearScreen":
      return "limpatela";
    case "pause":
      return "pausa";
    case "timer":
      return `timer ${statement.mode}`;
    case "echo":
      return `eco ${statement.mode}`;
    case "chronometer":
      return "cronometro";
    case "randomMode":
      return statement.mode === "range"
        ? `aleatorio ${statement.min}, ${statement.max}`
        : `aleatorio ${statement.mode}`;
    default:
      return statement.type;
  }
}

function loopLabel(statement) {
  if (statement.type === "for") {
    const step = statement.step === "1" ? "" : ` passo ${statement.step}`;
    return `para ${statement.variable} de ${statement.start} ate ${statement.end}${step}`;
  }
  if (statement.type === "while") return `enquanto ${statement.condition}`;
  return `repita ate ${statement.condition}`;
}

function loopEndLabel(statement) {
  if (statement.type === "for") return "fimpara";
  if (statement.type === "while") return "fimenquanto";
  return "ate";
}

function createBuilder() {
  return {
    nodes: [],
    edges: [],
    addNode(kind, label, line = null, level = null) {
      const node = {
        id: `n${this.nodes.length + 1}`,
        kind,
        label,
        line,
        level,
      };
      this.nodes.push(node);
      return node.id;
    },
    addEdge(from, to, label = "") {
      this.edges.push({ from, to, label });
    },
    labelEdge(from, to, label) {
      const edge = this.edges.find((item) => item.from === from && item.to === to);
      if (edge) {
        edge.label = label;
      } else {
        this.addEdge(from, to, label);
      }
    },
  };
}
