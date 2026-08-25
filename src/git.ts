import { simpleGit } from "simple-git";

const git = simpleGit();

export async function getDiff(): Promise<string> {
  const diff = await git.diff(["HEAD"]);
  if (!diff.trim()) {
    throw new Error("No changes to review. Make some edits before running this.");
  }
  return diff;
}

export async function getChangedFiles(): Promise<string[]> {
  const status = await git.status();
  return [...status.modified, ...status.not_added, ...status.created];
}
