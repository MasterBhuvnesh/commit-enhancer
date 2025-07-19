#!/usr/bin/env node

import chalk from "chalk";
import { runCommitWorkflow } from "./commit.js";

const main = async () => {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const autoConfirm = args.includes("-y") || args.includes("/y");
  const commitMessage = args.filter((arg) => !arg.startsWith("-")).join(" ");

  await runCommitWorkflow(commitMessage, autoConfirm);
};

main().catch((err) => {
  console.error(chalk.red("\nAn unexpected error occurred:"));
  console.error(err);
  process.exit(1);
});
