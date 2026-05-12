export interface MotorIconApi {
  icon(id: string, size?: number, cls?: string): string;
  iconEl(id: string, size?: number, cls?: string): SVGElement;
  setBase(url: string): void;
  normalizeIconId(id: string): string;
}

declare global {
  interface Window {
    MotorIcon: MotorIconApi;
  }
}

export function configureMotorIcon(baseUrl: string): void {
  if (!window.MotorIcon) {
    throw new Error("MotorIcon no esta disponible.");
  }

  window.MotorIcon.setBase(baseUrl);
}

export function renderIcon(id: string, size = 20, cls = ""): string {
  return window.MotorIcon.icon(id, size, cls);
}
