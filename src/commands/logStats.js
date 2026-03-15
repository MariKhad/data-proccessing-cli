import fs from "node:fs";
import { Worker } from "node:worker_threads";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const logStats = async (inputPath, outputPath, options = {}) => {
  try {
    await fs.promises.access(inputPath, fs.constants.F_OK);
  } catch (error) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const stats = await fs.promises.stat(inputPath);
  const fileSize = stats.size;

  const numCores = os.cpus().length;

  const chunks = await calculateChunks(inputPath, fileSize, numCores);

  const workerPromises = chunks.map((chunk, index) =>
    runWorker(chunk, index, inputPath),
  );

  const workerResults = await Promise.all(workerPromises);

  const finalStats = mergeStats(workerResults);

  await fs.promises.writeFile(
    outputPath,
    JSON.stringify(finalStats, null, 2),
    "utf8",
  );

  return finalStats;
};

async function calculateChunks(filePath, fileSize, numChunks) {
  const chunkSize = Math.ceil(fileSize / numChunks);
  const chunks = [];

  const fileHandle = await fs.promises.open(filePath, "r");

  try {
    let start = 0;

    for (let i = 0; i < numChunks; i++) {
      let end = Math.min(start + chunkSize, fileSize);

      if (i === numChunks - 1) {
        chunks.push({ start, end: fileSize });
        break;
      }

      const buffer = Buffer.alloc(1024);
      let position = end;

      while (position < fileSize) {
        const readLength = Math.min(1024, fileSize - position);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          readLength,
          position,
        );

        const newlineIndex = buffer.indexOf(10, 0);

        if (newlineIndex !== -1) {
          end = position + newlineIndex + 1;
          break;
        }

        position += bytesRead;
      }

      chunks.push({ start, end });
      start = end;
    }
  } finally {
    await fileHandle.close();
  }

  return chunks;
}

function runWorker(chunk, workerId, filePath) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "../workers/logWorker.js"), {
      workerData: {
        filePath,
        start: chunk.start,
        end: chunk.end,
        workerId,
      },
    });

    worker.on("message", (result) => {
      if (result.error) {
        reject(new Error(`Worker ${workerId} error: ${result.error}`));
      } else {
        resolve(result);
      }
    });

    worker.on("error", reject);

    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker ${workerId} stopped with exit code ${code}`));
      }
    });
  });
}

function mergeStats(workerResults) {
  const merged = {
    total: 0,
    levels: {},
    status: { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 },
    pathCounts: {},
    totalResponseTime: 0,
  };

  for (const result of workerResults) {
    merged.total += result.total;
    merged.totalResponseTime += result.totalResponseTime;

    for (const [level, count] of Object.entries(result.levels)) {
      merged.levels[level] = (merged.levels[level] || 0) + count;
    }

    for (const [status, count] of Object.entries(result.status)) {
      merged.status[status] = (merged.status[status] || 0) + count;
    }

    for (const [path, count] of Object.entries(result.pathCounts)) {
      merged.pathCounts[path] = (merged.pathCounts[path] || 0) + count;
    }
  }

  const avgResponseTimeMs =
    merged.total > 0 ? merged.totalResponseTime / merged.total : 0;

  const topPaths = Object.entries(merged.pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  return {
    total: merged.total,
    levels: merged.levels,
    status: merged.status,
    topPaths,
    avgResponseTimeMs: Number(avgResponseTimeMs.toFixed(2)),
  };
}
