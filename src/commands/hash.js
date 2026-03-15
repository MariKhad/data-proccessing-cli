import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

export const hash = async (
  inputPath,
  algorithm = "sha256",
  saveHash = false,
) => {
  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const hash = crypto.createHash(algorithm);
  const readStream = fs.createReadStream(inputPath);

  await pipeline(readStream, hash);

  const hashValue = hash.digest("hex");
  const result = { hash: hashValue };

  if (saveHash) {
    const hashFilePath = `${inputPath}.${algorithm}`;
    await fs.promises.writeFile(hashFilePath, hashValue, "utf8");
    result.savedTo = hashFilePath;
  }

  return result;
};
