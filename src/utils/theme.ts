import { VEIN_BASE_DIR } from "./env";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import type { Theme } from "../types";

const darkTheme: Theme = {
  primary: "#D97757",
  secondary: "#b1b9f9",
  border: "#fd5db1",
  secondaryBorder: "#888",
  text: "#fff",
  secondaryText: "#999",
  suggestion: "#b1b9f9",
  success: "#4eba65",
  error: "#ff6b80",
  warning: "#ffc107",
  diff: {
    added: "#225c2b",
    removed: "#7a2936",
    addedDimmed: "#47584a",
    removedDimmed: "#69484d",
  },
};

const lightTheme: Theme = {
  primary: "#D97757",
  secondary: "#5769f7",
  border: "#ff0087",
  secondaryBorder: "#999",
  text: "#000",
  secondaryText: "#666",
  suggestion: "#5769f7",
  success: "#2c7a39",
  error: "#ab2b3f",
  warning: "#966c1e",
  diff: {
    added: "#69db7c",
    removed: "#ffa8b4",
    addedDimmed: "#c7e1cb",
    removedDimmed: "#fdd2d8",
  },
};

const darkDaltonizedTheme: Theme = {
  primary: "#ff9933",
  secondary: "#99ccff",
  border: "#3399ff",
  secondaryBorder: "#888",
  text: "#fff",
  secondaryText: "#999",
  suggestion: "#99ccff",
  success: "#3399ff",
  error: "#ff6666",
  warning: "#ffcc00",
  diff: {
    added: "#004466",
    removed: "#660000",
    addedDimmed: "#3e515b",
    removedDimmed: "#3e2c2c",
  },
};

const lightDaltonizedTheme: Theme = {
  primary: "#ff9933",
  secondary: "#3366ff",
  border: "#0066cc",
  secondaryBorder: "#999",
  text: "#000",
  secondaryText: "#666",
  suggestion: "#3366ff",
  success: "#006699",
  error: "#cc0000",
  warning: "#ff9900",
  diff: {
    added: "#99ccff",
    removed: "#ffcccc",
    addedDimmed: "#d1e7fd",
    removedDimmed: "#ffe9e9",
  },
};

export type ThemeName =
  | "dark"
  | "light"
  | "dark-daltonized"
  | "light-daltonized";

function getConfig(): { theme?: ThemeName } {
  const configPath = join(VEIN_BASE_DIR, "config.json");
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {
    return {};
  }
}

export function getTheme(override?: ThemeName): Theme {
  const config = getConfig();
  switch (override ?? config.theme) {
    case "light":
      return lightTheme;
    case "light-daltonized":
      return lightDaltonizedTheme;
    case "dark-daltonized":
      return darkDaltonizedTheme;
    default:
      return darkTheme;
  }
}
