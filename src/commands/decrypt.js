import crypto from "node:crypto";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";

export const decrypt = async (inputPath, outputPath, password) => {
  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const fileHandle = await fs.promises.open(inputPath, "r");

  try {
    const headerBuffer = Buffer.alloc(28);

    await fileHandle.read(headerBuffer, 0, 28, 0);
    const salt = headerBuffer.subarray(0, 16);
    const iv = headerBuffer.subarray(16, 28);

    const stats = await fileHandle.stat();
    const fileSize = stats.size;

    if (fileSize < 44) {
      throw new Error(`File too small: ${fileSize} bytes (min 44 bytes)`);
    }

    const authTagBuffer = Buffer.alloc(16);
    await fileHandle.read(authTagBuffer, 0, 16, fileSize - 16);

    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTagBuffer);

    const dataStart = 28;
    const dataEnd = fileSize - 17;

    if (dataEnd < dataStart) {
      console.log("No data to decrypt, creating empty file");
      await fs.promises.writeFile(outputPath, "");
    } else {
      const readStream = fs.createReadStream(inputPath, {
        start: dataStart,
        end: dataEnd,
      });

      const writeStream = fs.createWriteStream(outputPath);

      await pipeline(readStream, decipher, writeStream);
    }
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  } finally {
    await fileHandle.close();
  }
};
