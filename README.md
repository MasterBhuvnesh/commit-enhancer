# Commit Enhancer

<p align="center">
    A powerful command-line tool that uses the Google Gemini API to supercharge your <code>git commit</code> workflow, helping you write clean, professional, and Conventional Commits-compliant messages with ease.
</p>

---

## Features

**commit-enhancer** is more than just a script; it's a smart assistant designed to make your development life easier.

- 🤖 **AI-Powered Commit Messages:** Leverages the Gemini API to turn your simple commit ideas into professional, well-formatted commit messages.
- 📝 **Context-Aware Suggestions:** Automatically includes a summary of your staged file changes (`git diff --staged`) in the prompt to give the AI context for more accurate suggestions.
- 🔄 **Interactive Rewrite Loop:** Not happy with the first suggestion? Ask the AI to rewrite it with an optional hint (e.g., "make it more concise") until you're satisfied.
- ✨ **Smart Staging Assistant:**
  - Detects if you've forgotten to stage your changes and prompts you to add them (`git add .`).
  - Correctly handles untracked files in newly created repositories.
- 🚀 **Automatic Git Initialization:** If you run the tool in a directory that isn't a Git repository, it will offer to initialize one for you (`git init`).
- 🔑 **Secure & Simple API Key Handling:**
  - Securely reads your API key from your project's local Git configuration.
  - If the key is missing, it prompts you to enter it for the current session and offers to save it for future use.
- ✅ **Pre-flight Safety Checks:**
  - Verifies that Git is installed.
  - Checks for active merge conflicts and prevents you from committing until they are resolved.
- 🎨 **User-Friendly Interface:** Uses colors and clear prompts to guide you through the entire process, from staging to committing.
- **Flexible Usage:** Run it interactively, or pass your commit message directly from the command line for a faster workflow.

---

## Usage

### 1. Running the Tool

Since this is an `npx` package, there is no installation required. Simply run the following command inside your project's directory:

```sh
npx commit-enhancer
```

### 2. First-Time Setup: API Key

The first time you run the tool in a project, it will ask for your Google Gemini API key.

- It will prompt you to enter the key directly in the terminal.
- It will then ask for permission to save the key to your project's local Git configuration (recommended).

Alternatively, you can set the key manually by running:

```sh
git config --local gemini.apikey "YOUR_API_KEY_HERE"
```

This key is stored in `.git/config` and will not be committed to your repository.

### 3. Command-Line Options

You can use **commit-enhancer** in several ways:

#### Interactive Mode (Recommended)

```sh
npx commit-enhancer
```

The tool will guide you through the entire process.

#### Direct Mode (Provide a message)

```sh
npx commit-enhancer "fix a bug in the login flow"
```

This will use your message as the initial prompt for the AI.

#### Auto-Confirm Mode (Fastest)

```sh
npx commit-enhancer -y "refactor the user service"
```

The `-y` flag will accept the first suggestion from the AI and commit it immediately without asking for confirmation.

---

## Git Tasks Performed

**commit-enhancer** automates several common Git tasks to streamline your workflow:

- `git init`: Initializes a new repository if run in a directory that is not already a Git repo.
- `git status`: Checks for merge conflicts and unstaged/untracked files.
- `git add .`: Stages all unstaged changes and untracked files upon user confirmation.
- `git diff --staged`: Gathers context about your changes to send to the AI.
- `git config`: Reads and writes your API key to the local repository configuration.
- `git commit -m "...":` Executes the final commit with the AI-generated message.

---

## License

This project is licensed under the ISC License.

## Scripts

Add the following to your `package.json` under the `"scripts"` section to enable testing:

```json
"scripts": {
    "test": "node ./scripts/test-runner.js"
}
```
