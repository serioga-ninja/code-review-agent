import simpleGit from "simple-git";

const git = simpleGit();

export async function getDiff(): Promise<string> {
  // staged + unstaged зміни відносно HEAD
  const diff = await git.diff(["HEAD"]);
  if (!diff.trim()) {
    throw new Error("Немає змін для рев'ю. Внеси правки перед запуском.");
  }
  return diff;
}

export async function getChangedFiles(): Promise<string[]> {
  const status = await git.status();
  return [...status.modified, ...status.not_added, ...status.created];
}
