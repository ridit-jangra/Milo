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
