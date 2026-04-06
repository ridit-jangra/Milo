import { getActiveProvider, buildProvider } from "./providers";

export async function getModel() {
  const config = await getActiveProvider();
  if (!config) {
    throw new Error(
      "no provider configured — run /provider add to get started 🐱",
    );
  }
  return {
    model: buildProvider(config),
    modelId: `${config.name} · ${config.model}`,
    config,
  };
}
