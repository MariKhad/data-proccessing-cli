import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

let currentWorkingDirectory = os.homedir();

export function getCurrentDir() {
  return currentWorkingDirectory;
}

export function setCurrentDir(newPath) {
  currentWorkingDirectory = newPath;
}

export async function changeDirectory(targetPath) {
  try {
    const resolvedPath = path.resolve(currentWorkingDirectory, targetPath);
    const stats = await fs.stat(resolvedPath);

    if (!stats.isDirectory()) {
      throw new Error("Not a directory");
    }

    setCurrentDir(resolvedPath);
    return resolvedPath;
  } catch (error) {
    throw new Error(`cd: ${error.message}`);
  }
}

export async function listDirectory(targetPath = ".") {
  try {
    const resolvedPath = path.resolve(currentWorkingDirectory, targetPath);
    const files = await fs.readdir(resolvedPath, { withFileTypes: true });

    const sorted = files.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const maxLength = Math.max(...sorted.map((f) => f.name.length)) + 2;

    const formatted = sorted
      .map((file) => {
        const type = file.isDirectory() ? "[folder]" : "[file]";
        const paddedName = file.name.padEnd(maxLength);
        return `${paddedName}${type}`;
      })
      .join("\n");

    return formatted || "(empty)";
  } catch (error) {
    throw new Error(`ls: ${error.message}`);
  }
}

export function resolvePath(relativePath) {
  return path.resolve(currentWorkingDirectory, relativePath);
}

export async function goUp() {
  const parentDir = path.dirname(currentWorkingDirectory);

  if (parentDir === currentWorkingDirectory) {
    return currentWorkingDirectory;
  }

  await changeDirectory(parentDir);
  return parentDir;
}
