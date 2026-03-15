import fs from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export const csvToJson = async (inputPath, outputPath, options = {}) => {
  const delimiter = options.delimiter || ",";

  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  let headers = [];
  let isFirstLine = true;
  let objectCount = 0;

  const csvToJsonTransform = new Transform({
    readableObjectMode: true,
    writableObjectMode: false,

    transform(chunk, encoding, callback) {
      try {
        const lines = chunk.toString().split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;

          const values = line.split(delimiter).map((v) => v.trim());

          if (isFirstLine) {
            headers = values;
            isFirstLine = false;

            this.push("[\n");
          } else {
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || "";
            });

            if (objectCount > 0) {
              this.push(",\n");
            }

            this.push(JSON.stringify(obj, null, 2));
            objectCount++;
          }
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },

    flush(callback) {
      this.push("\n]");
      callback();
    },
  });

  const readStream = fs.createReadStream(inputPath, { encoding: "utf8" });
  const writeStream = fs.createWriteStream(outputPath, { encoding: "utf8" });

  try {
    await pipeline(readStream, csvToJsonTransform, writeStream);
  } catch (error) {
    throw new Error(`CSV to JSON conversion failed: ${error.message}`);
  }
};
