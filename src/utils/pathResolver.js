import path from "node:path";
import { getCurrentDir } from "../navigation.js";

export const pathResolver = (relativePath) => {
  const currentDir = getCurrentDir();
  return path.resolve(currentDir, relativePath);
};
