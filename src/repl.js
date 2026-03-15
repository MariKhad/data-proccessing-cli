import { count } from "./commands/count.js";
import { csvToJson } from "./commands/csvToJson.js";
import { decrypt } from "./commands/decrypt.js";
import { encrypt } from "./commands/encrypt.js";
import { hash } from "./commands/hash.js";
import { hashCompare } from "./commands/hashCompare.js";
import { jsonToCsv } from "./commands/jsonToCsv.js";
import { logStats } from "./commands/logStats.js";
import { changeDirectory, goUp, listDirectory } from "./navigation.js";
import { argParser } from "./utils/argParser.js";
import { pathResolver } from "./utils/pathResolver.js";

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
    const { options } = argParser(args);

    if (!options.input || !options.output) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const outputPath = pathResolver(options.output);

    try {
      await csvToJson(inputPath, outputPath, options);
      console.log(`Converted ${inputPath} to ${outputPath}`);
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  "json-to-csv": async (args) => {
    const { options } = argParser(args);

    if (!options.input || !options.output) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const outputPath = pathResolver(options.output);

    try {
      await jsonToCsv(inputPath, outputPath, options);
      console.log(`Converted ${inputPath} to ${outputPath}`);
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  count: async (args) => {
    const { options, paths } = argParser(args);

    let inputFile = options.input || paths[0];
    if (!inputFile) {
      console.log("Invalid input");
      return "";
    }

    const resolvedPath = pathResolver(inputFile);
    const results = await count([resolvedPath]);

    const result = results[0];

    if (!result.success) {
      console.log("Operation failed");
      return "";
    }

    console.log(`Lines: ${result.lines}`);
    console.log(`Words: ${result.words}`);
    console.log(`Characters: ${result.characters}`);
    return "";
  },

  hash: async (args) => {
    const { options } = argParser(args);

    if (!options.input) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const algorithm = options.algorithm || "sha256";
    const saveHash = options.save || false;

    const supportedAlgorithms = ["sha256", "md5", "sha512"];
    if (!supportedAlgorithms.includes(algorithm)) {
      console.log("Operation failed");
      return "";
    }

    try {
      const result = await hash(inputPath, algorithm, saveHash);

      console.log(`${algorithm}: ${result.hash}`);

      if (saveHash && result.savedTo) {
        console.log(`Hash saved to: ${result.savedTo}`);
      }
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  "hash-compare": async (args) => {
    const { options } = argParser(args);

    if (!options.input || !options.hash) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const hashFilePath = pathResolver(options.hash);
    const algorithm = options.algorithm || "sha256";

    const supportedAlgorithms = ["sha256", "md5", "sha512"];
    if (!supportedAlgorithms.includes(algorithm)) {
      console.log("Operation failed");
      return "";
    }

    try {
      const result = await hashCompare(inputPath, hashFilePath, algorithm);
      console.log(result.match ? "OK" : "MISMATCH");
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  encrypt: async (args) => {
    const { options } = argParser(args);

    if (!options.input || !options.output || !options.password) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const outputPath = pathResolver(options.output);
    const password = options.password;

    try {
      await encrypt(inputPath, outputPath, password);
      console.log(`Encrypted ${inputPath} to ${outputPath}`);
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  decrypt: async (args) => {
    const { options } = argParser(args);

    if (!options.input || !options.output || !options.password) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const outputPath = pathResolver(options.output);
    const password = options.password;

    try {
      await decrypt(inputPath, outputPath, password);
      console.log(`Decrypted ${inputPath} to ${outputPath}`);
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
  },

  "log-stats": async (args) => {
    const { options } = argParser(args);

    if (!options.input || !options.output) {
      console.log("Invalid input");
      return "";
    }

    const inputPath = pathResolver(options.input);
    const outputPath = pathResolver(options.output);

    try {
      const stats = await logStats(inputPath, outputPath, options);
      console.log(`Stats written to ${outputPath}`);
      console.log(`Total requests: ${stats.total}`);
      console.log(`Average response time: ${stats.avgResponseTimeMs} ms`);
    } catch (error) {
      console.log("Operation failed");
    }

    return "";
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
