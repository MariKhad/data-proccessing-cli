import fs from "node:fs";
import { createInterface } from "node:readline";
import { parentPort, workerData } from "node:worker_threads";

const { filePath, start, end, workerId } = workerData;

async function processChunk() {
  const stats = {
    total: 0,
    levels: {},
    status: {},
    pathCounts: {},
    totalResponseTime: 0,
  };

  const readStream = fs.createReadStream(filePath, {
    encoding: "utf8",
    start,
    end: end - 1,
  });

  const rl = createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim() === "") continue;

    const parts = line.split(" ");

    if (parts.length < 7) continue;

    const [
      timestamp,
      level,
      service,
      statusCode,
      responseTimeMs,
      method,
      path,
    ] = parts;

    stats.total++;

    stats.levels[level] = (stats.levels[level] || 0) + 1;

    const statusNum = parseInt(statusCode, 10);
    if (!isNaN(statusNum)) {
      const classNum = Math.floor(statusNum / 100);
      if (classNum >= 2 && classNum <= 5) {
        const statusClass = classNum + "xx";
        stats.status[statusClass] = (stats.status[statusClass] || 0) + 1;
      }
    }

    stats.pathCounts[path] = (stats.pathCounts[path] || 0) + 1;

    stats.totalResponseTime += parseInt(responseTimeMs) || 0;
  }

  return stats;
}

processChunk()
  .then((result) => {
    parentPort.postMessage(result);
  })
  .catch((error) => {
    parentPort.postMessage({
      error: error.message,
      workerId,
    });
  });
