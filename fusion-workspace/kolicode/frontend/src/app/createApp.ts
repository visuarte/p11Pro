import { renderEditorShell } from "../editor/renderEditorShell";
import { configureMotorIcon, renderIcon } from "../shared/motor-icon";
import { projectContext } from "../shared/project-context";

const THEME_KEY = "p10pro-theme";

function resolveInitialTheme(): "light" | "dark" {
  const saved = window.localStorage.getItem(THEME_KEY);

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", mode);
  window.localStorage.setItem(THEME_KEY, mode);
}

function hydrateIcons(scope: ParentNode): void {
  scope.querySelectorAll<HTMLElement>("[data-icon]").forEach((node) => {
    node.innerHTML = renderIcon(node.dataset.icon ?? "alert", 18);
  });
}

function bindRail(scope: ParentNode): void {
  scope.querySelectorAll<HTMLButtonElement>(".rail__button").forEach((button) => {
    button.addEventListener("click", () => {
      scope.querySelectorAll(".rail__button").forEach((item) => item.classList.remove("rail__button--active"));
      button.classList.add("rail__button--active");
    });
  });
}

function bindThemeToggle(scope: ParentNode): void {
  const themeToggle = scope.querySelector<HTMLButtonElement>("#themeToggle");

  if (!themeToggle) {
    return;
  }

  const syncLabel = (): void => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    themeToggle.textContent = current === "dark" ? "Modo claro" : "Modo oscuro";
  };

  syncLabel();

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
    syncLabel();
  });
}

export function createApp(root: HTMLElement, iconBaseUrl: string): void {
  configureMotorIcon(iconBaseUrl);
  applyTheme(resolveInitialTheme());

  root.innerHTML = renderEditorShell(projectContext);
  hydrateIcons(root);
  bindRail(root);
  bindThemeToggle(root);
}
