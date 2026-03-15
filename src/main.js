import readline from "node:readline";
import os from "node:os";
import { handleCommand } from "./repl.js";
import { getCurrentDir } from "./navigation.js";

let rl;

export function startRepl() {
  console.log("Welcome to Data Processing CLI!");
  console.log(`You are currently in ${getCurrentDir()}`);

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const input = line.trim();

    if (input === ".exit") {
      rl.close();
      return;
    }

    try {
      await handleCommand(input);
      console.log(`You are currently in ${getCurrentDir()}`);
    } catch (error) {
      console.log("Operation failed");
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Thank you for using Data Processing CLI!");
    process.exit(0);
  });

  rl.on("SIGINT", () => {
    rl.close();
  });
}

startRepl();
