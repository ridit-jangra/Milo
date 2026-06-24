import { CONFIG_FILE } from "./env";
import { existsSync, readFileSync, writeFileSync } from "fs";
import type { Theme } from "../types";

const darkTheme: Theme = {
  name: "dark",
  primary: "#CBA6F7",
  secondary: "#89DCEB",
  border: "#45475A",
  secondaryBorder: "#585B70",
  text: "#CDD6F4",
  secondaryText: "#A6ADC8",
  money: "#A6E3A1",
  suggestion: "#B4BEFE",
  success: "#A6E3A1",
  error: "#F38BA8",
  warning: "#F9E2AF",
  diff: {
    added: "#2A3B2E",
    removed: "#3F2A35",
    addedDimmed: "#313A34",
    removedDimmed: "#3A3036",
  },
};

const lightTheme: Theme = {
  name: "light",
  primary: "#D97757",
  secondary: "#5769f7",
  border: "#D97757",
  secondaryBorder: "#999",
  text: "#000",
  secondaryText: "#666",
  money: "#3a7d1e",
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
  name: "darkDaltonized",
  primary: "#ff9933",
  secondary: "#99ccff",
  border: "#ff9933",
  secondaryBorder: "#888",
  text: "#fff",
  secondaryText: "#999",
  money: "#66ccff",
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
  name: "lightDaltonized",
  primary: "#ff9933",
  secondary: "#3366ff",
  border: "#ff9933",
  secondaryBorder: "#999",
  text: "#000",
  secondaryText: "#666",
  money: "#006633",
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

function getConfig(): { theme?: string } {
  if (!existsSync(CONFIG_FILE)) {
    writeFileSync(CONFIG_FILE, JSON.stringify({ theme: darkTheme.name }));
    return { theme: darkTheme.name };
  }
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

export function getTheme(override?: string): Theme {
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
