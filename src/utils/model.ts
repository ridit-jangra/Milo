import { createGroq } from "@ai-sdk/groq";

export const provider = createGroq({
  apiKey: process.env.APIKEY,
});

export const modelId = "openai/gpt-oss-120b";
