import { createGroq } from "@ai-sdk/groq";

export const provider = createGroq({
  apiKey: process.env.APIKEY,
});

export const modelId = "meta-llama/llama-4-scout-17b-16e-instruct";
