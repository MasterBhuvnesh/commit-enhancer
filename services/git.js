/**
 * @file This module encapsulates all direct interactions with the Git command-line interface.
 * It uses 'execa' to run Git commands and handles their output.
 */

import execa from "execa";
import chalk from "chalk";
import * as ui from "../ui.js";

/**
 * Performs pre-flight checks to ensure the environment is ready.
 * Verifies Git installation, repository status, and checks for merge conflicts.
 * @returns {Promise<boolean>} True if all checks pass, false otherwise.
 */
export const preflightChecks = async () => {
  try {
    await execa("git", ["--version"]);
  } catch (error) {
    console.error(
      chalk.red("Error: Git is not installed or not found in your PATH.")
    );
    return false;
  }

  try {
    await execa("git", ["rev-parse", "--is-inside-work-tree"]);
  } catch (error) {
    const shouldInit = await ui.promptToInitRepo();
    if (shouldInit) {
      try {
        // Try to initialize git repository with 'main' as the default branch (Git 2.28+)
        await execa("git", ["init", "--initial-branch=main"]);
        console.log(
          chalk.green(
            "Successfully initialized a new Git repository with 'main' as the default branch."
          )
        );
      } catch (initError) {
        // Fallback for older Git versions
        await execa("git", ["init"]);
        try {
          // Check if we're on master and rename to main
          const { stdout: currentBranch } = await execa("git", [
            "symbolic-ref",
            "--short",
            "HEAD",
          ]);
          if (currentBranch && currentBranch === "master") {
            await execa("git", ["branch", "-m", "master", "main"]);
            console.log(
              chalk.green(
                "Successfully initialized a new Git repository and renamed default branch to 'main'."
              )
            );
          } else {
            console.log(
              chalk.green("Successfully initialized a new Git repository.")
            );
          }
        } catch (branchError) {
          // If branch operations fail, that's okay - the repo is still initialized
          console.error(
            chalk.red("Warning: Branch operation failed. The repository was initialized, but the branch could not be renamed.")
          );
          console.error(chalk.yellow(`Details: ${branchError.message}`));
          console.log(
            chalk.green("Successfully initialized a new Git repository.")
          );
        }
      }
    } else {
      console.log(chalk.red("Operation cancelled."));
      return false;
    }
  }

  try {
    const { stdout } = await execa("git", ["status", "--porcelain"]);
    if (stdout.includes("UU")) {
      console.error(chalk.red("Error: Merge conflict detected."));
      console.error(
        chalk.yellow("Please resolve the conflicts before committing.")
      );
      return false;
    }
  } catch (error) {
    /* Ignore potential errors if git status fails in an odd state */
  }

  return true;
};

/**
 * Retrieves the Gemini API key. It prioritizes environment variables for CI environments,
 * then falls back to local Git configuration.
 * @returns {Promise<string|null>} The API key if found, otherwise null.
 */
export const getApiKey = async () => {
  // Priority 1: Check for environment variable (ideal for CI/CD)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Priority 2: Check local git config (for local development)
  try {
    const { stdout } = await execa("git", ["config", "gemini.apikey"]);
    return stdout || null;
  } catch (error) {
    return null; // Return null if the config key doesn't exist.
  }
};

/**
 * Saves the provided API key to the local Git configuration.
 * @param {string} apiKey - The API key to save.
 */
export const saveApiKey = async (apiKey) => {
  await execa("git", ["config", "--local", "gemini.apikey", apiKey]);
  console.log(chalk.green("API key has been saved to your local git config."));
};

/**
 * Checks for staged files and prompts the user to stage changes if necessary.
 * @returns {Promise<boolean>} True if there are staged files to commit, false otherwise.
 */
export const handleStaging = async () => {
  try {
    await execa("git", ["diff", "--staged", "--quiet"]);
  } catch (stagedError) {
    return true; // Exit code 1 means files are staged.
  }

  const { stdout: status } = await execa("git", ["status", "--porcelain"]);
  if (!status) {
    console.log(chalk.yellow("No changes to commit. Working tree clean."));
    return false;
  }

  const shouldAdd = await ui.promptToStageFiles();
  if (shouldAdd) {
    await execa("git", ["add", "."]);
    console.log(chalk.green("All changes have been staged."));
    return true;
  } else {
    console.log(
      chalk.red("Please stage your files manually before committing.")
    );
    return false;
  }
};

/**
 * Gets a summary of staged file changes to provide context to the AI.
 * @returns {Promise<string>} A formatted string of staged changes, or a message indicating no changes.
 */
export const getStagedDiff = async () => {
  try {
    const { stdout } = await execa("git", ["diff", "--staged", "--stat"]);
    return stdout
      ? `Staged file changes:\n\`\`\`\n${stdout}\n\`\`\``
      : "No staged file changes detected.";
  } catch (error) {
    return "Could not retrieve staged file changes.";
  }
};

/**
 * Executes the final `git commit` command with the provided message.
 * @param {string} message - The commit message.
 */
export const performCommit = async (message) => {
  try {
    await execa("git", ["commit", "-m", message]);
    console.log(chalk.green("\n✅ Commit successful!"));
  } catch (error) {
    console.error(chalk.red("Error executing git commit:"));
    console.error(
      chalk.yellow(
        "This might be due to a failing pre-commit hook or other Git issues."
      )
    );
    console.error(error.stderr || error.message);
  }
};
