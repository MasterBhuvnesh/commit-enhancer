import { execa } from "execa";
import axios from "axios";
import chalk from "chalk";
import inquirer from "inquirer";

// --- Helper Functions ---

const getApiKey = async () => {
  try {
    const { stdout } = await execa("git", ["config", "gemini.apikey"]);
    return stdout;
  } catch (error) {
    console.error(chalk.red("Error: Gemini API key not found in Git config."));
    console.log(
      chalk.yellow("\nPlease set it for this repository by running:")
    );
    console.log(
      chalk.cyan('  git config --local gemini.apikey "YOUR_API_KEY_HERE"')
    );
    return null;
  }
};

const getStagedDiff = async () => {
  try {
    const { stdout } = await execa("git", ["diff", "--staged", "--stat"]);
    return stdout
      ? `Staged file changes:\n\`\`\`\n${stdout}\n\`\`\``
      : "No staged file changes detected.";
  } catch (error) {
    return "Could not retrieve staged file changes.";
  }
};

const getCommitSuggestion = async (apiKey, prompt) => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  try {
    const response = await axios.post(API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    let suggestion =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Clean up markdown backticks
    return suggestion.trim().replace(/^`+|`+$/g, "");
  } catch (error) {
    console.error(chalk.red("Error calling Gemini API:"));
    console.error(error.response?.data || error.message);
    return null;
  }
};

// --- Main Workflow ---

export const runCommitWorkflow = async (initialMessage, autoConfirm) => {
  const apiKey = await getApiKey();
  if (!apiKey) return;

  let rawCommit = initialMessage;
  if (!rawCommit) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "rawCommit",
        message: "Enter your raw commit message:",
      },
    ]);
    rawCommit = answers.rawCommit;
  }

  if (!rawCommit) {
    console.log("No commit message entered. Exiting.");
    return;
  }

  let currentSuggestion = "";

  while (true) {
    const diffContext = await getStagedDiff();
    const prompt = `You are an expert Git commit message writer. Generate a professional commit message in the Conventional Commits standard based on the user's intent and the staged file changes. The user's intent is: "${rawCommit}".\n\n${diffContext}\n\nReturn only the single-line, formatted commit message and nothing else.`;

    console.log(chalk.yellow("\n🤔 Thinking..."));
    currentSuggestion = await getCommitSuggestion(apiKey, prompt);

    if (!currentSuggestion) {
      console.log(chalk.red("Could not get a suggestion. Please try again."));
      return;
    }

    console.log(chalk.cyan("\nGemini's suggestion:"));
    console.log("----------------------------------------");
    console.log(chalk.green(currentSuggestion));
    console.log("----------------------------------------");

    if (autoConfirm) {
      break;
    }

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

    if (action === "commit") {
      break;
    }
    if (action === "cancel") {
      console.log("Commit cancelled.");
      return;
    }
    if (action === "rewrite") {
      const { rewriteHint } = await inquirer.prompt([
        {
          type: "input",
          name: "rewriteHint",
          message:
            'How should I rewrite it? (e.g., "make it more concise") [optional]:',
        },
      ]);
      rawCommit = `Rewrite the following commit message${
        rewriteHint ? ` to be ${rewriteHint}` : ""
      }: "${currentSuggestion}"`;
    }
  }

  // Perform the commit
  try {
    await execa("git", ["commit", "-m", currentSuggestion]);
    console.log(chalk.green("\n✅ Commit successful!"));
  } catch (error) {
    console.error(chalk.red("Error executing git commit:"));
    console.error(error.stderr || error.message);
  }
};
