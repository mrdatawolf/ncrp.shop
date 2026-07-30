export function isLlmEnabled(): boolean {
  return process.env.ALLOW_LLM === "true";
}
