export function createThemeController({
  themeSelect,
  layoutSelect,
  tabSizeSelect,
  infiniteLoopDetectionSelect,
  debugPanelVisibilitySelect,
  generalFontSizeInput,
  generalFontSizeValue,
  editorFontSizeInput,
  editorFontSizeValue,
  consoleFontSizeInput,
  consoleFontSizeValue,
  editorFontSelect,
  lineWrapSelect,
  indentGuidesSelect,
  complexityMetricsSelect,
  settingsButton,
  settingsDropdown,
  workspace,
  editor,
  onComplexityMetricsChange = () => {},
}) {
  return {
    init() {
      this.apply(localStorage.getItem("visualg-theme") ?? "dracula");
      this.applyLayout(
        localStorage.getItem("visualg-panel-layout") ?? "console-first",
      );
      this.applyTabSize(localStorage.getItem("visualg-tab-size") ?? "2");
      this.applyInfiniteLoopDetection(
        localStorage.getItem("visualg-infinite-loop-detection") ?? "on",
      );
      this.applyDebugPanelVisibility(
        localStorage.getItem("visualg-debug-panel-visibility") ?? "on",
      );
      this.applyGeneralFontSize(
        localStorage.getItem("visualg-general-font-size") ?? "16",
      );
      this.applyEditorFontSize(
        localStorage.getItem("visualg-editor-font-size") ?? "15",
      );
      this.applyConsoleFontSize(
        localStorage.getItem("visualg-console-font-size") ?? "14",
      );
      this.applyEditorFont(
        localStorage.getItem("visualg-editor-font") ??
          "Consolas, Cascadia Code, monospace",
      );
      this.applyLineWrap(localStorage.getItem("visualg-line-wrap") ?? "on");
      this.applyIndentGuides(
        localStorage.getItem("visualg-indent-guides") ?? "on",
      );
      this.applyComplexityMetrics(
        localStorage.getItem("visualg-complexity-metrics") ?? "on",
      );
      themeSelect.addEventListener("change", () => {
        this.apply(themeSelect.value);
      });
      layoutSelect.addEventListener("change", () => {
        this.applyLayout(layoutSelect.value);
      });
      tabSizeSelect.addEventListener("change", () => {
        this.applyTabSize(tabSizeSelect.value);
      });
      infiniteLoopDetectionSelect.addEventListener("change", () => {
        this.applyInfiniteLoopDetection(
          infiniteLoopDetectionSelect.checked ? "on" : "off",
        );
      });
      debugPanelVisibilitySelect.addEventListener("change", () => {
        this.applyDebugPanelVisibility(
          debugPanelVisibilitySelect.checked ? "on" : "off",
        );
      });
      generalFontSizeInput.addEventListener("input", () => {
        this.applyGeneralFontSize(generalFontSizeInput.value);
      });
      editorFontSizeInput.addEventListener("input", () => {
        this.applyEditorFontSize(editorFontSizeInput.value);
      });
      consoleFontSizeInput.addEventListener("input", () => {
        this.applyConsoleFontSize(consoleFontSizeInput.value);
      });
      editorFontSelect.addEventListener("change", () => {
        this.applyEditorFont(editorFontSelect.value);
      });
      lineWrapSelect.addEventListener("change", () => {
        this.applyLineWrap(lineWrapSelect.checked ? "on" : "off");
      });
      indentGuidesSelect.addEventListener("change", () => {
        this.applyIndentGuides(indentGuidesSelect.checked ? "on" : "off");
      });
      complexityMetricsSelect.addEventListener("change", () => {
        this.applyComplexityMetrics(
          complexityMetricsSelect.checked ? "on" : "off",
        );
      });
      if (settingsButton) {
        settingsButton.addEventListener("click", () => this.toggle());
      }
      if (settingsButton && settingsDropdown) {
        document.addEventListener("click", (event) => {
          if (
            !settingsButton.contains(event.target) &&
            !settingsDropdown.contains(event.target)
          ) {
            this.close();
          }
        });
      }
    },
    apply(theme) {
      document.body.dataset.theme = theme;
      themeSelect.value = theme;
      localStorage.setItem("visualg-theme", theme);
    },
    applyLayout(layout) {
      workspace.dataset.panelLayout = layout;
      layoutSelect.value = layout;
      localStorage.setItem("visualg-panel-layout", layout);
    },
    applyTabSize(tabSize) {
      tabSizeSelect.value = tabSize;
      localStorage.setItem("visualg-tab-size", tabSize);
    },
    applyInfiniteLoopDetection(value) {
      const nextValue = normalizeSwitchValue(value);
      infiniteLoopDetectionSelect.checked = nextValue === "on";
      infiniteLoopDetectionSelect.setAttribute(
        "aria-checked",
        String(infiniteLoopDetectionSelect.checked),
      );
      localStorage.setItem("visualg-infinite-loop-detection", nextValue);
    },
    applyDebugPanelVisibility(value) {
      const nextValue = normalizeSwitchValue(value);
      workspace.dataset.debugPanel = nextValue;
      debugPanelVisibilitySelect.checked = nextValue === "on";
      debugPanelVisibilitySelect.setAttribute(
        "aria-checked",
        String(debugPanelVisibilitySelect.checked),
      );
      localStorage.setItem("visualg-debug-panel-visibility", nextValue);
    },
    applyGeneralFontSize(fontSize) {
      const nextSize = clampNumber(fontSize, 12, 22, 16);
      document.documentElement.style.setProperty(
        "--app-font-size",
        `${nextSize}px`,
      );
      generalFontSizeInput.value = String(nextSize);
      generalFontSizeValue.textContent = `${nextSize}px`;
      localStorage.setItem("visualg-general-font-size", String(nextSize));
    },
    applyEditorFontSize(fontSize) {
      const nextSize = clampNumber(fontSize, 12, 28, 15);
      document.documentElement.style.setProperty(
        "--editor-font-size",
        `${nextSize}px`,
      );
      editorFontSizeInput.value = String(nextSize);
      editorFontSizeValue.textContent = `${nextSize}px`;
      localStorage.setItem("visualg-editor-font-size", String(nextSize));
    },
    applyConsoleFontSize(fontSize) {
      const nextSize = clampNumber(fontSize, 12, 24, 14);
      document.documentElement.style.setProperty(
        "--console-font-size",
        `${nextSize}px`,
      );
      consoleFontSizeInput.value = String(nextSize);
      consoleFontSizeValue.textContent = `${nextSize}px`;
      localStorage.setItem("visualg-console-font-size", String(nextSize));
    },
    applyEditorFont(fontFamily) {
      document.documentElement.style.setProperty(
        "--editor-font-family",
        fontFamily,
      );
      editorFontSelect.value = fontFamily;
      localStorage.setItem("visualg-editor-font", fontFamily);
    },
    applyLineWrap(lineWrap) {
      const nextValue = normalizeSwitchValue(lineWrap);
      lineWrapSelect.checked = nextValue === "on";
      lineWrapSelect.setAttribute(
        "aria-checked",
        String(lineWrapSelect.checked),
      );
      editor.setLineWrapping(nextValue === "on");
      localStorage.setItem("visualg-line-wrap", nextValue);
    },
    applyIndentGuides(indentGuides) {
      const nextValue = normalizeSwitchValue(indentGuides);
      indentGuidesSelect.checked = nextValue === "on";
      indentGuidesSelect.setAttribute(
        "aria-checked",
        String(indentGuidesSelect.checked),
      );
      document.body.dataset.indentGuides = nextValue;
      localStorage.setItem("visualg-indent-guides", nextValue);
    },
    applyComplexityMetrics(value) {
      const nextValue = normalizeSwitchValue(value);
      complexityMetricsSelect.checked = nextValue === "on";
      complexityMetricsSelect.setAttribute(
        "aria-checked",
        String(complexityMetricsSelect.checked),
      );
      localStorage.setItem("visualg-complexity-metrics", nextValue);
      onComplexityMetricsChange(nextValue === "on");
    },
    getTabSize() {
      return Number(tabSizeSelect.value) || 2;
    },
    getRuntimeOptions() {
      return {
        detectInfiniteLoop: infiniteLoopDetectionSelect.checked,
      };
    },
    isDebugPanelVisible() {
      return debugPanelVisibilitySelect.checked;
    },
    isComplexityMetricsEnabled() {
      return complexityMetricsSelect.checked;
    },
    toggle() {
      if (!settingsDropdown || !settingsButton) return;
      const nextHidden = !settingsDropdown.hidden;
      settingsDropdown.hidden = nextHidden;
      settingsButton.setAttribute("aria-expanded", String(!nextHidden));
    },
    close() {
      if (!settingsDropdown || !settingsButton) return;
      settingsDropdown.hidden = true;
      settingsButton.setAttribute("aria-expanded", "false");
    },
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.round(number), min), max);
}

function normalizeSwitchValue(value) {
  return value === "off" || value === false ? "off" : "on";
}
