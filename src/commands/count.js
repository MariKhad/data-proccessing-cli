import fs from "node:fs";
import { createInterface } from "node:readline";

export const count = async (inputPaths) => {
  const countFile = async (filePath) => {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
    } catch (error) {
      return {
        path: filePath,
        error: `File not found: ${filePath}`,
        success: false,
      };
    }

    let lines = 0;
    let words = 0;
    let characters = 0;

    const readStream = fs.createReadStream(filePath, {
      encoding: "utf8",
      highWaterMark: 64 * 1024,
    });

    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      lines++;
      characters += line.length + 1;

      let i = 0;
      const lineLength = line.length;

      while (i < lineLength) {
        while (i < lineLength && /\s/.test(line[i])) {
          i++;
        }

        if (i < lineLength) {
          words++;
          while (i < lineLength && !/\s/.test(line[i])) {
            i++;
          }
        }
      }
    }

    return {
      path: filePath,
      lines,
      words,
      characters,
      success: true,
    };
  };

  if (Array.isArray(inputPaths)) {
    const results = [];
    for (const filePath of inputPaths) {
      const result = await countFile(filePath);
      results.push(result);
    }
    return results;
  } else {
    return await countFile(inputPaths);
  }
};
