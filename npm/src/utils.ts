import { stat, rm as RM } from "fs/promises";
import { join } from "path";

export async function fileExists(s: string): Promise<boolean> {
  try {
    const f = await stat(s)
    return f.isFile();
  } catch {
    return false;
  }
}

export async function searchPath(filename: string): Promise<string | undefined> {
  const paths = process.env["PATH"]?.split(":") ?? [];
  const priorityPath = process.env['LOCAL_BINARY_PATH'];
  if (priorityPath && priorityPath.length > 0) {
    paths.unshift(priorityPath);
  }
  for (const p of paths) {
    if (await fileExists(join(p, filename))) return p;
  }
  return undefined;
}

export const inherit: 'inherit' = 'inherit';

export async function rm(path: string): Promise<void> {
  try {
    await RM(path);
  } catch (e) {}
}
