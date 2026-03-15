import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

export const encrypt = async (inputPath, outputPath, password) => {
  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);

  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const writeStream = fs.createWriteStream(outputPath);

  writeStream.write(salt);
  writeStream.write(iv);

  const readStream = fs.createReadStream(inputPath);

  await pipeline(readStream, cipher, writeStream);

  const authTag = cipher.getAuthTag();

  await fs.promises.appendFile(outputPath, authTag);
};
