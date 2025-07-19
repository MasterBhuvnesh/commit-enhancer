/**
 * @file This module handles all interactions with the Google Gemini API.
 * It is responsible for constructing the prompt and making the API call.
 */

import axios from "axios";
import chalk from "chalk";

/**
 * Constructs the prompt to be sent to the Gemini API.
 * @param {string} rawCommit - The user's initial, raw commit message.
 * @param {string} diffContext - A string containing the summary of staged file changes.
 * @returns {string} The fully constructed prompt.
 */
export const constructPrompt = (rawCommit, diffContext) => {
  return `You are an expert Git commit message writer. Generate a professional commit message in the Conventional Commits standard based on the user's intent and the staged file changes. The user's intent is: "${rawCommit}".\n\n${diffContext}\n\nReturn only the single-line, formatted commit message and nothing else.`;
};

/**
 * Fetches a commit message suggestion from the Gemini API.
 * @param {string} apiKey - The user's Google Gemini API key.
 * @param {string} prompt - The prompt to send to the API.
 * @returns {Promise<string|null>} The AI-generated commit message, or null if an error occurs.
 */
export const getCommitSuggestion = async (apiKey, prompt) => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  try {
    const response = await axios.post(API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });
    // Safely access the suggestion text and clean up any markdown backticks.
    let suggestion =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return suggestion.trim().replace(/^`+|`+$/g, "");
  } catch (error) {
    console.error(chalk.red("Error calling Gemini API:"));
    if (error.response) {
      if (error.response.status === 429) {
        console.error(
          chalk.yellow(
            "You have exceeded your API request limit. Please wait and try again."
          )
        );
      } else {
        console.error(`Server responded with status ${error.response.status}.`);
      }
    } else if (error.request) {
      console.error(
        chalk.yellow(
          "Could not connect to the Gemini API. Please check your internet connection."
        )
      );
    } else {
      console.error("An unexpected error occurred:", error.message);
    }
    return null;
  }
};
