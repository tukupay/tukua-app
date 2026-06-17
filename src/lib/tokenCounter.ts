/** Format token count for display (matches yana/src/lib/tokenCounter.ts). */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
  return tokens.toString();
}
