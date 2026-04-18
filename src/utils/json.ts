export function safeParseJSON(json: string | null | undefined): unknown {
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function repairJSON(raw: string): string | null {
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    const repaired = raw
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      return null;
    }
  }
}
