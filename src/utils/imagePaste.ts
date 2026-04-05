import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";

const SCREENSHOT_PATH_MAC = "/tmp/milo_latest_screenshot.png";
const SCREENSHOT_PATH_WIN = "%TEMP%\\milo_latest_screenshot.png";
const SCREENSHOT_PATH_LINUX = "/tmp/milo_latest_screenshot.png";

export const CLIPBOARD_ERROR_MESSAGE =
  "No image found in clipboard. Use your platform screenshot tool to copy a screenshot to clipboard.";

export function getImageFromClipboard(): string | null {
  switch (process.platform) {
    case "darwin":
      return getMacClipboard();
    case "win32":
      return getWindowsClipboard();
    case "linux":
      return getLinuxClipboard();
    default:
      return null;
  }
}

function getMacClipboard(): string | null {
  try {
    execSync(`osascript -e 'the clipboard as «class PNGf»'`, {
      stdio: "ignore",
    });
    execSync(
      `osascript -e 'set png_data to (the clipboard as «class PNGf»)' -e 'set fp to open for access POSIX file "${SCREENSHOT_PATH_MAC}" with write permission' -e 'write png_data to fp' -e 'close access fp'`,
      { stdio: "ignore" },
    );
    return readAndCleanup(SCREENSHOT_PATH_MAC);
  } catch {
    return null;
  }
}

function getWindowsClipboard(): string | null {
  const path = SCREENSHOT_PATH_WIN;
  try {
    execSync(
      `powershell -command "Add-Type -Assembly System.Windows.Forms; $img = [System.Windows.Forms.Clipboard]::GetImage(); if ($img -eq $null) { exit 1 }; $img.Save('${path}')"`,
      { stdio: "ignore" },
    );
    return readAndCleanup(path);
  } catch {
    return null;
  }
}

function getLinuxClipboard(): string | null {
  const path = SCREENSHOT_PATH_LINUX;
  try {
    const isWayland = !!process.env.WAYLAND_DISPLAY;
    if (isWayland) {
      execSync(`wl-paste --type image/png > "${path}"`, { stdio: "ignore" });
    } else {
      execSync(`xclip -selection clipboard -t image/png -o > "${path}"`, {
        stdio: "ignore",
      });
    }
    if (!existsSync(path)) return null;
    return readAndCleanup(path);
  } catch {
    return null;
  }
}

function readAndCleanup(path: string): string | null {
  try {
    const base64 = readFileSync(path).toString("base64");
    execSync(`rm -f "${path}"`, { stdio: "ignore" });
    return base64;
  } catch {
    return null;
  }
}
