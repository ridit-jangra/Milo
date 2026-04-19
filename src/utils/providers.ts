import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ai-sdk-ollama";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export type ProviderType =
  | "groq"
  | "openai"
  | "anthropic"
  | "ollama"
  | "openrouter"
  | "google";

export type ProviderConfig = {
  name: string;
  provider: ProviderType;
  model: string;
  apiKey?: string;
  baseURL?: string;
};

export type ProvidersFile = {
  active: string;
  providers: ProviderConfig[];
};

const PROVIDERS_FILE = join(homedir(), ".milo", "providers.json");

const EMPTY_PROVIDERS: ProvidersFile = {
  active: "",
  providers: [],
};

export async function readProviders(): Promise<ProvidersFile> {
  try {
    const raw = await readFile(PROVIDERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY_PROVIDERS };
  }
}

export async function writeProviders(data: ProvidersFile): Promise<void> {
  await mkdir(join(homedir(), ".milo"), { recursive: true });
  await writeFile(PROVIDERS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getActiveProvider(): Promise<ProviderConfig | null> {
  const data = await readProviders();
  if (!data.active || data.providers.length === 0) return null;
  return data.providers.find((p) => p.name === data.active) ?? null;
}

export async function setActiveProvider(name: string): Promise<void> {
  const data = await readProviders();
  if (!data.providers.find((p) => p.name === name)) {
    throw new Error(`Provider "${name}" not found`);
  }
  data.active = name;
  await writeProviders(data);
}

export async function addProvider(config: ProviderConfig): Promise<void> {
  const data = await readProviders();
  const exists = data.providers.findIndex((p) => p.name === config.name);
  if (exists >= 0) {
    data.providers[exists] = config;
  } else {
    data.providers.push(config);
  }
  // auto-set as active if it's the first one
  if (data.providers.length === 1) {
    data.active = config.name;
  }
  await writeProviders(data);
}

export async function removeProvider(name: string): Promise<void> {
  const data = await readProviders();
  data.providers = data.providers.filter((p) => p.name !== name);
  if (data.active === name) {
    data.active = data.providers[0]?.name ?? "";
  }
  await writeProviders(data);
}

export function buildProvider(config: ProviderConfig): LanguageModel {
  switch (config.provider) {
    case "groq":
      return createGroq({ apiKey: config.apiKey })(config.model);
    case "openai":
      return createOpenAI({
        apiKey: config.apiKey,
        ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      })(config.model);
    case "anthropic":
      return createAnthropic({ apiKey: config.apiKey })(config.model);
    case "ollama":
      return createOllama({
        baseURL: config.baseURL ?? "http://localhost:11434/api",
      })(config.model);
    case "google":
      return createGoogleGenerativeAI({ apiKey: config.apiKey })(config.model);
    case "openrouter":
      return createOpenRouter({
        apiKey: config.apiKey,
        ...(config.baseURL ? { baseURL: config.baseURL } : {}),
      })(config.model);
  }
}
