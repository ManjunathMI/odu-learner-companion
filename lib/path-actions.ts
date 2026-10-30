// Shared browser action; the DELETE API independently enforces path/platform-admin access.
export async function confirmPathDeletion(
  pathId: string,
  title: string,
  confirm: (message: string) => boolean | Promise<boolean>,
  remove: (pathId: string) => Promise<unknown>,
): Promise<boolean> {
  if (!await confirm(`Permanently delete "${title}"?\n\nThis removes the learning path, its lessons, memberships, learner progress and personal notes for everyone in this path.\n\nThis cannot be undone. The app cannot restore this path.\n\nChoose Delete path to permanently delete it, or Cancel to keep it.`)) return false;
  await remove(pathId);
  return true;
}
