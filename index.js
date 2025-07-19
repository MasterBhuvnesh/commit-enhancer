#!/usr/bin/env node
/**
 * @file The main entry point for the commit-enhancer CLI tool.
 * This file is responsible for parsing command-line arguments and initiating
 * the main commit workflow.
 */

import chalk from "chalk";
import { runCommitWorkflow } from "./commit.js";

/**
 * The main function that orchestrates the CLI tool.
 */
const main = async () => {
  // Parse command-line arguments, ignoring the first two (node executable and script path).
  const args = process.argv.slice(2);

  // Check for the auto-confirm flag (-y or /y).
  const autoConfirm = args.includes("-y") || args.includes("/y");

  // Join all non-flag arguments to form the initial commit message.
  const commitMessage = args.filter((arg) => !arg.startsWith("-")).join(" ");

  // Start the main application workflow.
  await runCommitWorkflow(commitMessage, autoConfirm);
};

// Execute the main function and handle any top-level errors.
main().catch((err) => {
  console.error(chalk.red("\nAn unexpected error occurred:"));
  console.error(err);
  process.exit(1);
});
