export function createFlowchartDialog({ dialog, content, title, closeButton, exportSvgButton, exportPngButton, onExportSvg, onExportPng }) {
  let currentChart = null;
  let currentName = "Fluxograma";
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function updateTransform() {
    const svg = content.querySelector(".flowchart-svg");
    if (svg) {
      svg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    }
  }

  function fitToScreen() {
    const svg = content.querySelector(".flowchart-svg");
    const size = getSvgViewBoxSize(svg);
    if (!size) return;
    const transform = calculateFlowchartFitTransform({
      viewportWidth: content.clientWidth || 920,
      viewportHeight: content.clientHeight || 620,
      contentWidth: size.width,
      contentHeight: size.height,
    });
    zoom = transform.zoom;
    panX = transform.panX;
    panY = transform.panY;
    updateTransform();
  }

  return {
    open(chart, name = "Fluxograma") {
      currentChart = chart;
      currentName = name;
      title.textContent = name;
      content.innerHTML = renderFlowchartSvg(chart);
      exportSvgButton.disabled = false;
      exportPngButton.disabled = false;
      zoom = 1;
      panX = 0;
      panY = 0;
      dialog.showModal();
      fitToScreen();
    },
    showError(message) {
      currentChart = null;
      currentName = "Fluxograma";
      title.textContent = "Fluxograma";
      content.replaceChildren(createError(message));
      exportSvgButton.disabled = true;
      exportPngButton.disabled = true;
      dialog.showModal();
    },
    init() {
      closeButton.addEventListener("click", () => dialog.close());
      exportSvgButton.addEventListener("click", () => {
        if (currentChart) onExportSvg(createExportableFlowchartSvg(currentChart), currentName);
      });
      exportPngButton.addEventListener("click", async () => {
        if (currentChart) await onExportPng(createExportableFlowchartSvg(currentChart), currentName);
      });

      const zoomInButton = dialog.querySelector("#flowchartZoomInButton");
      const zoomOutButton = dialog.querySelector("#flowchartZoomOutButton");
      const zoomResetButton = dialog.querySelector("#flowchartZoomResetButton");
      const fitButton = dialog.querySelector("#flowchartFitButton");

      zoomInButton?.addEventListener("click", () => {
        zoom = Math.min(zoom * 1.2, 4);
        updateTransform();
      });
      zoomOutButton?.addEventListener("click", () => {
        zoom = Math.max(zoom / 1.2, 0.2);
        updateTransform();
      });
      zoomResetButton?.addEventListener("click", () => {
        zoom = 1;
        panX = 0;
        panY = 0;
        updateTransform();
      });
      fitButton?.addEventListener("click", fitToScreen);

      content.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        if (e.deltaY < 0) {
          zoom = Math.min(zoom * zoomFactor, 4);
        } else {
          zoom = Math.max(zoom / zoomFactor, 0.2);
        }
        updateTransform();
      }, { passive: false });

      content.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
      });

      globalThis.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
      });

      globalThis.addEventListener("mouseup", () => {
        isDragging = false;
      });
    },
  };
}

export function calculateFlowchartFitTransform({
  viewportWidth,
  viewportHeight,
  contentWidth,
  contentHeight,
  padding = 24,
}) {
  const safeViewportWidth = Math.max(1, Number(viewportWidth) || 1);
  const safeViewportHeight = Math.max(1, Number(viewportHeight) || 1);
  const safeContentWidth = Math.max(1, Number(contentWidth) || 1);
  const safeContentHeight = Math.max(1, Number(contentHeight) || 1);
  const availableWidth = Math.max(1, safeViewportWidth - padding * 2);
  const availableHeight = Math.max(1, safeViewportHeight - padding * 2);
  const zoom = clamp(Math.min(availableWidth / safeContentWidth, availableHeight / safeContentHeight), 0.2, 1);
  return {
    zoom: Number(zoom.toFixed(3)),
    panX: Math.round(Math.max(padding, (safeViewportWidth - safeContentWidth * zoom) / 2)),
    panY: Math.round(Math.max(padding, (safeViewportHeight - safeContentHeight * zoom) / 2)),
  };
}

function getSvgViewBoxSize(svg) {
  const viewBox = svg?.getAttribute("viewBox")?.match(/^0 0 ([\d.]+) ([\d.]+)$/);
  if (!viewBox) return null;
  return {
    width: Number(viewBox[1]),
    height: Number(viewBox[2]),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function renderFlowchartSvg(chart, { exportable = false } = {}) {
  const layout = layoutFlowchartNodes(chart);
  const width = layout.width;
  const height = Math.max(260, layout.height + 80);
  const edges = chart.edges.map((edge) => renderEdge(edge, layout.positions)).join("");
  const nodes = chart.nodes.map((node) => renderNode(node, layout.positions.get(node.id))).join("");
  const namespace = exportable ? ' xmlns="http://www.w3.org/2000/svg"' : "";
  const styles = exportable ? `<style>${exportStyles()}</style>` : "";
  const background = exportable ? `<rect class="flowchart-export-bg" width="100%" height="100%"></rect>` : "";

  return `<svg${namespace} class="flowchart-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Fluxograma do algoritmo">
  <defs>
    <marker id="flowchart-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z"></path>
    </marker>
  </defs>
  ${styles}
  ${background}
  ${edges}
  ${nodes}
</svg>`;
}

export function createExportableFlowchartSvg(chart) {
  return renderFlowchartSvg(chart, { exportable: true });
}

export async function svgToPngDataUrl(svgText) {
  const image = new Image();
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = url;
    });

    const viewBox = svgText.match(/viewBox="0 0 (\d+) (\d+)"/);
    const width = Number(viewBox?.[1] ?? 920);
    const height = Number(viewBox?.[2] ?? 620);
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function flowchartExportName(name, extension) {
  const base = String(name || "fluxograma")
    .replace(/\.[^.]+$/, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .trim() || "fluxograma";
  return `${base}-fluxograma.${extension}`;
}

export function layoutFlowchartNodes(chart) {
  const positions = new Map();
  const centerX = 560;
  const startY = 48;
  const gapY = 96;
  const branchGapX = 250;
  let hasBranchLayout = false;

  chart.nodes.forEach((node) => {
    const level = node.level !== null && node.level !== undefined ? node.level : 0;
    positions.set(node.id, {
      x: centerX,
      y: startY + level * gapY,
      width: node.kind === "decision" ? 260 : 300,
      height: node.kind === "decision" ? 72 : 56,
    });
  });

  for (const node of chart.nodes) {
    if (node.kind !== "decision") continue;
    const outgoing = chart.edges.filter((edge) => edge.from === node.id);
    const yes = outgoing.find((edge) => normalizeEdgeLabel(edge.label) === "sim");
    const no = outgoing.find((edge) => normalizeEdgeLabel(edge.label) === "nao");
    if (!yes || !no) continue;

    const joinId = findFirstCommonTarget(chart, yes.to, no.to);
    hasBranchLayout = true;
    const decision = positions.get(node.id);
    if (joinId) positions.get(joinId).x = decision.x;
    shiftBranch(chart, positions, yes.to, joinId, -branchGapX);
    shiftBranch(chart, positions, no.to, joinId, branchGapX);
  }

  let bounds = measureBounds(positions);
  const offsetX = Math.max(24, 24 - bounds.minX);
  if (offsetX !== 0) {
    for (const position of positions.values()) position.x += offsetX;
  }
  bounds = measureBounds(positions);

  return {
    positions,
    width: Math.ceil(Math.max(hasBranchLayout ? 1120 : 920, bounds.maxX + 24)),
    height: Math.max(260, bounds.maxY + 60),
  };
}

function measureBounds(positions) {
  return [...positions.values()].reduce((acc, position) => ({
    minX: Math.min(acc.minX, position.x - position.width / 2),
    maxX: Math.max(acc.maxX, position.x + position.width / 2),
    maxY: Math.max(acc.maxY, position.y + position.height / 2),
  }), { minX: Infinity, maxX: -Infinity, maxY: 0 });
}

function shiftBranch(chart, positions, startId, stopId, deltaX) {
  const visited = new Set();
  const stack = [startId];

  while (stack.length) {
    const id = stack.pop();
    if (!id || id === stopId || visited.has(id)) continue;
    visited.add(id);
    const position = positions.get(id);
    if (position) position.x += deltaX;
    for (const edge of chart.edges.filter((item) => item.from === id)) {
      stack.push(edge.to);
    }
  }
}

function findFirstCommonTarget(chart, leftStart, rightStart) {
  const left = collectReachable(chart, leftStart);
  const right = collectReachable(chart, rightStart);
  for (const id of left) {
    if (right.has(id)) return id;
  }
  return null;
}

function collectReachable(chart, startId) {
  const visited = new Set();
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop();
    if (!id || visited.has(id)) continue;
    visited.add(id);
    for (const edge of chart.edges.filter((item) => item.from === id)) {
      stack.push(edge.to);
    }
  }
  return visited;
}

function normalizeEdgeLabel(label) {
  return String(label || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function renderEdge(edge, positions) {
  const from = positions.get(edge.from);
  const to = positions.get(edge.to);
  if (!from || !to) return "";

  const startX = from.x;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y - to.height / 2;
  const path = buildEdgePath(from, to, startX, startY, endX, endY);
  const label = edge.label
    ? `<text class="flowchart-edge-label" x="${(startX + endX) / 2 + 18}" y="${(startY + endY) / 2 - 6}">${escapeHtml(edge.label)}</text>`
    : "";

  return `<path class="flowchart-edge" d="${path}" marker-end="url(#flowchart-arrow)"></path>${label}`;
}

function buildEdgePath(from, to, startX, startY, endX, endY) {
  const deltaX = endX - startX;
  if (endY > startY && Math.abs(deltaX) > 80) {
    const midY = startY + 28;
    return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
  }

  if (endY > startY) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  const side = deltaX >= 0 ? 1 : -1;
  const controlX = Math.max(from.x, to.x) + 180 * side;
  return `M ${startX + from.width / 2 * side} ${from.y} C ${controlX} ${from.y}, ${controlX} ${to.y}, ${endX + to.width / 2 * side} ${to.y}`;
}

function renderNode(node, position) {
  const label = splitLabel(node.label);
  const line = node.line ? `<text class="flowchart-node-line" x="${position.x}" y="${position.y + position.height / 2 - 8}">linha ${node.line}</text>` : "";
  const textStart = position.y - (label.length - 1) * 8;
  const text = label.map((item, index) => (
    `<text class="flowchart-node-text" x="${position.x}" y="${textStart + index * 17}">${escapeHtml(item)}</text>`
  )).join("");

  if (node.kind === "decision") {
    const points = [
      `${position.x},${position.y - position.height / 2}`,
      `${position.x + position.width / 2},${position.y}`,
      `${position.x},${position.y + position.height / 2}`,
      `${position.x - position.width / 2},${position.y}`,
    ].join(" ");
    return `<g class="flowchart-node flowchart-${node.kind}"><polygon points="${points}"></polygon>${text}${line}</g>`;
  }

  const rx = node.kind === "terminal" ? 28 : 8;
  return `<g class="flowchart-node flowchart-${node.kind}">
    <rect x="${position.x - position.width / 2}" y="${position.y - position.height / 2}" width="${position.width}" height="${position.height}" rx="${rx}"></rect>
    ${text}
    ${line}
  </g>`;
}

function splitLabel(label) {
  const normalized = String(label || "").trim();
  if (normalized.length <= 34) return [normalized];
  const words = normalized.split(/\s+/);
  const lines = [""];
  for (const word of words) {
    const current = lines.at(-1);
    if (`${current} ${word}`.trim().length > 34 && lines.length < 3) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${current} ${word}`.trim();
    }
  }
  return lines;
}

function createError(message) {
  const box = document.createElement("div");
  box.className = "flowchart-error";
  box.textContent = message;
  return box;
}

function exportStyles() {
  return `
    .flowchart-export-bg { fill: #111218; }
    .flowchart-edge { fill: none; stroke: #67d9ef; stroke-width: 2; }
    marker path { fill: #67d9ef; }
    .flowchart-edge-label { fill: #f1fa8c; font: 700 12px Consolas, monospace; }
    .flowchart-node rect, .flowchart-node polygon { fill: #272936; stroke: #5a5f78; stroke-width: 1.5; }
    .flowchart-terminal rect { fill: #20362d; stroke: #50fa7b; }
    .flowchart-decision polygon, .flowchart-loop rect { fill: #322945; stroke: #bd93f9; }
    .flowchart-input rect, .flowchart-output rect { fill: #203644; stroke: #8be9fd; }
    .flowchart-node-text { fill: #f8f8f2; font: 700 13px Consolas, monospace; text-anchor: middle; dominant-baseline: middle; }
    .flowchart-node-line { fill: #b6b6c8; font: 10px Consolas, monospace; text-anchor: middle; }
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
