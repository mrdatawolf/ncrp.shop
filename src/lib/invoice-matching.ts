const STOPWORDS = new Set(["the", "a", "an", "of", "and", "vol", "volume", "issue", "no", "hc", "tp"]);

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t && !STOPWORDS.has(t))
  );
}

export function scoreMatch(lineDescription: string, pullListTitle: string, issueInfo?: string | null): number {
  const a = tokenize(lineDescription);
  const b = tokenize(issueInfo ? `${pullListTitle} ${issueInfo}` : pullListTitle);
  if (a.size === 0 || b.size === 0) return 0;

  let overlap = 0;
  for (const t of a) if (b.has(t)) overlap++;
  const union = new Set([...a, ...b]).size;
  const jaccard = overlap / union;

  const normA = [...a].sort().join(" ");
  const normB = [...b].sort().join(" ");
  const substringBonus = normA.includes(normB) || normB.includes(normA) ? 0.25 : 0;

  return Math.min(1, jaccard + substringBonus);
}

export function rankCandidates<T extends { title: string; issueInfo: string | null }>(
  lineDescription: string,
  candidates: T[]
): (T & { score: number })[] {
  return candidates
    .map((c) => ({ ...c, score: scoreMatch(lineDescription, c.title, c.issueInfo) }))
    .sort((x, y) => y.score - x.score);
}
