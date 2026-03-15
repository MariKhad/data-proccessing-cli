import fs from "node:fs";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";

export const hashCompare = async (
  inputPath,
  hashFilePath,
  algorithm = "sha256",
) => {
  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  try {
    await fs.promises.access(hashFilePath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Hash file not found: ${hashFilePath}`);
  }

  const expectedHash = await fs.promises.readFile(hashFilePath, "utf8");

  const cleanExpectedHash = expectedHash.trim().toLowerCase();

  const hash = crypto.createHash(algorithm);
  const readStream = fs.createReadStream(inputPath);

  await pipeline(readStream, hash);

  const calculatedHash = hash.digest("hex").toLowerCase();

  return {
    match: calculatedHash === cleanExpectedHash,
    expected: cleanExpectedHash,
    calculated: calculatedHash,
  };
};
