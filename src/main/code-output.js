export function defaultCodeFileName(fileName = "algoritmo.alg") {
  const normalized = String(fileName || "").trim();
  if (!normalized) return "algoritmo.alg";
  return normalized.toLowerCase().endsWith(".alg") ? normalized : `${normalized}.alg`;
}

export function buildCodePrintHtml({ title = "Algoritmo", content = "" } = {}) {
  const safeTitle = escapeHtml(title || "Algoritmo");
  const safeContent = escapeHtml(content);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>${safeTitle}</title>
    <style>
      body {
        margin: 0;
        background: #f3f4f6;
        color: #111827;
        font-family: Arial, sans-serif;
      }
      .print-toolbar {
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 18px;
        border-bottom: 1px solid #d1d5db;
        background: #111827;
        color: #f9fafb;
      }
      .print-toolbar strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .print-toolbar button {
        border: 0;
        border-radius: 6px;
        padding: 8px 14px;
        background: #16a34a;
        color: #052e16;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      main {
        width: min(920px, calc(100vw - 48px));
        min-height: calc(100vh - 110px);
        margin: 24px auto;
        padding: 32px;
        background: #ffffff;
        box-shadow: 0 12px 32px rgb(0 0 0 / 0.12);
      }
      h1 {
        margin: 0 0 18px;
        font-size: 18px;
      }
      pre {
        margin: 0;
        white-space: pre-wrap;
        font-family: Consolas, "Cascadia Code", monospace;
        font-size: 12px;
        line-height: 1.45;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .print-toolbar {
          display: none;
        }
        main {
          width: auto;
          min-height: 0;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="print-toolbar">
      <strong>${safeTitle}</strong>
      <button type="button" onclick="window.print()">Imprimir</button>
    </div>
    <main>
      <h1>${safeTitle}</h1>
      <pre>${safeContent}</pre>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
