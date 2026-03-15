import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";

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

    const formatted = files
      .map((file) => {
        const type = file.isDirectory() ? "DIR" : "FILE";
        return `${type}\t${file.name}`;
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
  await changeDirectory(parentDir);
  return parentDir;
}
