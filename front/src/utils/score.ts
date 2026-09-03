export function formatScorePercentage(score: number): string {
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.round(normalized)}%`;
}
