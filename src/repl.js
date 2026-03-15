import { changeDirectory, listDirectory, goUp } from "./navigation.js";
import { csvToJson } from "./commands/csvToJson.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { count } from "./commands/count.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { encrypt } from "./commands/encrypt.js";
import { decrypt } from "./commands/decrypt.js";
import { logStats } from "./commands/logStats.js";
import { parseArgs } from "./utils/argParser.js";
import { resolvePath } from "./utils/pathResolver.js";

const COMMANDS = {
  up: async () => {
    await goUp();
    return "";
  },

  cd: async (args) => {
    if (!args[0]) throw new Error("Invalid input");
    await changeDirectory(args[0]);
    return "";
  },

  ls: async (args) => {
    return await listDirectory(args[0] || ".");
  },

  "csv-to-json": async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 1) throw new Error("Invalid input");

    const inputPath = resolvePath(paths[0]);
    const outputPath = paths[1]
      ? resolvePath(paths[1])
      : inputPath.replace(/\.csv$/i, ".json");

    await csvToJson(inputPath, outputPath, options);
    return `Converted ${inputPath} to ${outputPath}`;
  },

  "json-to-csv": async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 1) throw new Error("Invalid input");

    const inputPath = resolvePath(paths[0]);
    const outputPath = paths[1]
      ? resolvePath(paths[1])
      : inputPath.replace(/\.json$/i, ".csv");

    await jsonToCsv(inputPath, outputPath, options);
    return `Converted ${inputPath} to ${outputPath}`;
  },

  count: async (args) => {
    const { paths } = parseArgs(args);
    if (paths.length < 1) throw new Error("Invalid input");

    const resolvedPaths = paths.map((p) => resolvePath(p));
    const results = await count(resolvedPaths);

    return results.map((r) => `${r.path}: ${r.count} lines`).join("\n");
  },

  hash: async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 1) throw new Error("Invalid input");

    const algorithm = options.algorithm || options.a || "sha256";
    const resolvedPaths = paths.map((p) => resolvePath(p));
    const results = await hash(resolvedPaths, algorithm);

    return results.map((r) => `${r.path}: ${r.hash}`).join("\n");
  },

  "hash-compare": async (args) => {
    const { paths } = parseArgs(args);
    if (paths.length < 2) throw new Error("Invalid input");

    const [path1, path2] = paths.map((p) => resolvePath(p));
    const result = await hashCompare(path1, path2);

    return result.match ? "Files match" : "Files do not match";
  },

  encrypt: async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 2 || !(options.password || options.p))
      throw new Error("Invalid input");

    const password = options.password || options.p;
    const inputPath = resolvePath(paths[0]);
    const outputPath = resolvePath(paths[1]);

    await encrypt(inputPath, outputPath, password);
    return `Encrypted ${inputPath} to ${outputPath}`;
  },

  decrypt: async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 2 || !(options.password || options.p))
      throw new Error("Invalid input");

    const password = options.password || options.p;
    const inputPath = resolvePath(paths[0]);
    const outputPath = resolvePath(paths[1]);

    await decrypt(inputPath, outputPath, password);
    return `Decrypted ${inputPath} to ${outputPath}`;
  },

  "log-stats": async (args) => {
    const { options, paths } = parseArgs(args);
    if (paths.length < 1) throw new Error("Invalid input");

    const resolvedPaths = paths.map((p) => resolvePath(p));
    const stats = await logStats(resolvedPaths, options);

    const output = [];
    output.push(`Total requests: ${stats.total}`);
    output.push("Top paths:");
    stats.topPaths.forEach((item, i) => {
      output.push(`  ${i + 1}. ${item.path} (${item.count})`);
    });

    return output.join("\n");
  },
};

export async function handleCommand(input) {
  const [command, ...args] = input.trim().split(/\s+/);

  if (!command) return "";

  if (!COMMANDS[command]) {
    console.log("Invalid input");
    return "";
  }

  try {
    const result = await COMMANDS[command](args);
    if (result) {
      console.log(result);
    }
    return result;
  } catch (error) {
    console.log("Operation failed");
    throw error;
  }
}
