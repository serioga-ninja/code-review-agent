const MAX_DIFF_CHARS = 40000;

export function checkDiffSize(diff: string): { safe: boolean; charCount: number } {
  return {
    safe: diff.length <= MAX_DIFF_CHARS,
    charCount: diff.length,
  };
}

export function splitDiffByFile(diff: string): string[] {
  // git diff blocks start with "diff --git"
  const chunks = diff.split(/(?=^diff --git )/m).filter(Boolean);
  return chunks;
}
