/**
 * @file This script runs an automated, end-to-end test for the commit-enhancer CLI.
 * It simulates a user workflow by creating a file, running the enhancer non-interactively,
 * verifying the result, and cleaning up afterwards.
 */

import execa from "execa";
import chalk from "chalk";

/**
 * The main test execution function.
 */
const run = async () => {
  console.log(chalk.blue.bold("--- E2E Test Report for commit-enhancer ---\n"));
  const originalHead = await getHead();
  const initialTestMessage = "chore: update test file with new timestamp";

  try {
    // --- Step 1: Create a file change ---
    console.log(chalk.cyan("1. Creating a test file change..."));
    await execa("node", ["./scripts/create-test-file.js"]);
    console.log(chalk.green("   ✓ File `testing.json` created/updated.\n"));

    // --- Step 2: Stage the change ---
    console.log(chalk.cyan("2. Staging the new file..."));
    await execa("git", ["add", "testing.json"]);
    console.log(chalk.green("   ✓ `git add testing.json` executed.\n"));

    // --- Step 3: Run commit-enhancer automatically ---
    console.log(
      chalk.cyan("3. Running `commit-enhancer` in auto-confirm mode...")
    );
    const enhancerPromise = execa("node", [
      "./index.js",
      "-y", // Auto-confirm flag
      initialTestMessage, // Pass the initial test message
    ]);

    // Pipe the output of the enhancer to our console in real-time
    enhancerPromise.stdout.pipe(process.stdout);
    await enhancerPromise;
    console.log(
      chalk.green("\n   ✓ `commit-enhancer` executed successfully.\n")
    );

    // --- Step 4: Verify the new commit ---
    console.log(chalk.cyan("4. Verifying the new commit..."));
    const { stdout: finalCommitMessage } = await execa("git", [
      "log",
      "-1",
      "--pretty=format:%s",
    ]);
    console.log(
      chalk.green("   ✓ Last commit message found:"),
      chalk.magenta(`"${finalCommitMessage}"`)
    );

    // Verification: Check if the AI actually modified the initial message.
    if (finalCommitMessage.toLowerCase() === initialTestMessage.toLowerCase()) {
      throw new Error(
        "Verification failed: The AI did not modify the initial commit message."
      );
    }
    console.log(chalk.green("   ✓ Verification passed!\n"));
  } catch (error) {
    console.error(chalk.red("\n--- ❌ Test Failed! ---"));
    console.error(error);
    process.exit(1);
  } finally {
    // --- Step 5: Cleanup ---
    // This block runs whether the test passes or fails, ensuring a clean state.
    console.log(chalk.cyan("5. Cleaning up the test commit..."));
    if (originalHead) {
      // If there was a commit before, reset to it.
      await execa("git", ["reset", "--hard", originalHead]);
    } else {
      // If this was the first commit ever, remove it to leave a clean repo.
      await execa("git", ["update-ref", "-d", "HEAD"]);
    }
    console.log(
      chalk.green("   ✓ Repository has been reset to its original state.\n")
    );
  }

  console.log(chalk.green.bold("--- ✅ All Tests Passed Successfully! ---"));
};

/**
 * Gets the hash of the current HEAD commit.
 * @returns {Promise<string|null>} The commit hash, or null if there are no commits.
 */
const getHead = async () => {
  try {
    // --verify ensures the command fails if HEAD doesn't exist.
    const { stdout } = await execa("git", ["rev-parse", "--verify", "HEAD"]);
    return stdout;
  } catch (e) {
    // This fails if there are no commits yet, which is a valid state for our test.
    return null;
  }
};

// Start the test runner.
run();
