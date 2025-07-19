/**
 * @file This file orchestrates the main workflow of the commit-enhancer tool.
 * It coordinates calls to the git, gemini, and ui modules to guide the user
 * from pre-flight checks to the final commit.
 */

import chalk from "chalk";
import * as git from "./services/git.js";
import * as gemini from "./services/gemini.js";
import * as ui from "./ui.js";

/**
 * Runs the entire commit enhancement workflow from start to finish.
 * @param {string} initialMessage - The commit message passed directly via command line.
 * @param {boolean} autoConfirm - A flag to automatically accept the first AI suggestion.
 */
export const runCommitWorkflow = async (initialMessage, autoConfirm) => {
  // 1. Perform environment and Git repository checks.
  if (!(await git.preflightChecks())) return;

  // 2. Get the API key, prompting the user if it's not found.
  let apiKey = await git.getApiKey();
  if (!apiKey) {
    apiKey = await ui.promptForApiKey();
    if (!apiKey) return; // User cancelled the API key prompt.
    const shouldSave = await ui.promptToSaveApiKey();
    if (shouldSave) {
      await git.saveApiKey(apiKey);
    }
  }

  // 3. Ensure there are changes to be committed, prompting to stage if necessary.
  if (!(await git.handleStaging())) return;

  // 4. Get the user's initial commit intent.
  let rawCommit = initialMessage;
  if (!rawCommit) {
    rawCommit = await ui.promptForInitialCommit();
  }
  if (!rawCommit) {
    console.log("No commit message entered. Exiting.");
    return;
  }

  let currentSuggestion = "";

  // 5. Start the suggestion and rewrite loop.
  while (true) {
    const diffContext = await git.getStagedDiff();
    const prompt = gemini.constructPrompt(rawCommit, diffContext);

    console.log(chalk.yellow("\n🤔 Thinking..."));
    currentSuggestion = await gemini.getCommitSuggestion(apiKey, prompt);

    if (!currentSuggestion) {
      console.log(chalk.red("Could not get a suggestion. Please try again."));
      return;
    }

    ui.displaySuggestion(currentSuggestion);

    // If in auto-confirm mode, break the loop and commit immediately.
    if (autoConfirm) {
      break;
    }

    // 6. Ask the user for the next action (commit, rewrite, or cancel).
    const action = await ui.promptForAction();

    if (action === "commit") break;
    if (action === "cancel") {
      console.log("Commit cancelled.");
      return;
    }
    if (action === "rewrite") {
      const rewriteHint = await ui.promptForRewriteHint();
      // Prepare the next prompt for the AI, asking it to rewrite the message.
      rawCommit = `Rewrite the following commit message${
        rewriteHint ? ` to be ${rewriteHint}` : ""
      }: "${currentSuggestion}"`;
    }
  }

  // 7. Perform the final git commit.
  await git.performCommit(currentSuggestion);
};
