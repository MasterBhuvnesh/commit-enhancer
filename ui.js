/**
 * @file This module manages all user-facing interactions,
 * including prompts and displaying messages, using 'inquirer' and 'chalk'.
 */

import inquirer from "inquirer";
import chalk from "chalk";

/**
 * Asks the user if they want to initialize a new Git repository.
 * @returns {Promise<boolean>} True if the user confirms.
 */
export const promptToInitRepo = async () => {
  const { shouldInit } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldInit",
      message: "Would you like to initialize a new Git repository here?",
      default: true,
    },
  ]);
  return shouldInit;
};

/**
 * Prompts the user to enter their API key for the current session.
 * @returns {Promise<string>} The API key entered by the user.
 */
export const promptForApiKey = async () => {
  console.log(chalk.yellow("\nYou can set the key permanently by running:"));
  console.log(
    chalk.cyan('  git config --local gemini.apikey "YOUR_API_KEY_HERE"\n')
  );
  const { apiKey } = await inquirer.prompt([
    {
      type: "password",
      name: "apiKey",
      message: "Or, enter your Gemini API key for this session:",
      mask: "*",
    },
  ]);
  return apiKey;
};

/**
 * Asks the user if they want to save the entered API key to their local git config.
 * @returns {Promise<boolean>} True if the user confirms.
 */
export const promptToSaveApiKey = async () => {
  const { shouldSave } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldSave",
      message:
        "Would you like to save this key to your local git config for future use?",
      default: true,
    },
  ]);
  return shouldSave;
};

/**
 * Prompts the user to stage all unstaged/untracked files.
 * @returns {Promise<boolean>} True if the user confirms.
 */
export const promptToStageFiles = async () => {
  console.log(chalk.yellow("No files are staged for commit."));
  const { shouldAdd } = await inquirer.prompt([
    {
      type: "confirm",
      name: "shouldAdd",
      message:
        "You have unstaged changes and/or untracked files. Do you want to stage all of them now? (git add .)",
      default: true,
    },
  ]);
  return shouldAdd;
};

/**
 * Prompts the user for their initial commit message intent.
 * @returns {Promise<string>} The raw commit message from the user.
 */
export const promptForInitialCommit = async () => {
  const { rawCommit } = await inquirer.prompt([
    {
      type: "input",
      name: "rawCommit",
      message: "Enter your raw commit message:",
    },
  ]);
  return rawCommit;
};

/**
 * Displays the AI-generated commit suggestion to the user.
 * @param {string} suggestion - The commit message to display.
 */
export const displaySuggestion = (suggestion) => {
  console.log(chalk.cyan("\nGemini's suggestion:"));
  console.log("----------------------------------------");
  console.log(chalk.green(suggestion));
  console.log("----------------------------------------");
};

/**
 * Prompts the user to choose their next action (commit, rewrite, cancel).
 * @returns {Promise<'commit'|'rewrite'|'cancel'>} The user's selected action.
 */
export const promptForAction = async () => {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What do you want to do?",
      choices: [
        { name: "✅ Commit with this message", value: "commit" },
        { name: "🔄 Rewrite the message", value: "rewrite" },
        { name: "❌ Cancel commit", value: "cancel" },
      ],
    },
  ]);
  return action;
};

/**
 * Prompts the user for a hint on how to rewrite the commit message.
 * @returns {Promise<string>} The user's rewrite hint.
 */
export const promptForRewriteHint = async () => {
  const { rewriteHint } = await inquirer.prompt([
    {
      type: "input",
      name: "rewriteHint",
      message:
        'How should I rewrite it? (e.g., "make it more concise") [optional]:',
    },
  ]);
  return rewriteHint;
};
