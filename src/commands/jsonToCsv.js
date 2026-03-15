import fs from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

export const jsonToCsv = async (inputPath, outputPath, options = {}) => {
  const { delimiter = ",", headers: includeHeaders = true } = options;

  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  let jsonBuffer = "";
  let headers = [];
  let headersWritten = false;

  const jsonParser = new Transform({
    readableObjectMode: true,
    writableObjectMode: false,

    transform(chunk, encoding, callback) {
      try {
        jsonBuffer += chunk.toString();

        if (jsonBuffer.includes("[") && jsonBuffer.includes("]")) {
          try {
            const data = JSON.parse(jsonBuffer);

            if (!Array.isArray(data)) {
              throw new Error("Input must be a JSON array");
            }

            if (data.length === 0) {
              this.push([]);
              jsonBuffer = "";
              return callback();
            }

            headers = Object.keys(data[0]);
            this.push(data);
            jsonBuffer = "";
          } catch (e) {
            return callback(new Error("Invalid JSON format"));
          }
        }
        callback();
      } catch (error) {
        callback(error);
      }
    },
  });

  const csvConverter = new Transform({
    writableObjectMode: true,
    readableObjectMode: false,

    transform(data, encoding, callback) {
      try {
        let csvContent = "";

        if (data.length === 0) {
          return callback(null, "");
        }

        if (includeHeaders && !headersWritten && headers.length > 0) {
          csvContent += headers.join(delimiter) + "\n";
          headersWritten = true;
        }

        for (const item of data) {
          const row = headers
            .map((header) => {
              const value = item[header] ?? "";
              if (
                String(value).includes(delimiter) ||
                String(value).includes('"') ||
                String(value).includes("\n")
              ) {
                return `"${String(value).replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(delimiter);

          csvContent += row + "\n";
        }

        callback(null, csvContent);
      } catch (error) {
        callback(error);
      }
    },
  });

  const readStream = fs.createReadStream(inputPath, { encoding: "utf8" });
  const writeStream = fs.createWriteStream(outputPath, { encoding: "utf8" });

  try {
    await pipeline(readStream, jsonParser, csvConverter, writeStream);
  } catch (error) {
    throw new Error(`JSON to CSV conversion failed: ${error.message}`);
  }
};
