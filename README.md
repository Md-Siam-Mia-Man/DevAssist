# DevAssist 🚀🤖

<p align="center">
  <a href="https://www.npmjs.com/package/@devassist-for-ai/devassist"><img src="https://img.shields.io/npm/v/@devassist-for-ai/devassist.svg?style=for-the-badge&logo=npm" alt="npm version"/></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/github/license/Md-Siam-Mia-Man/DevAssist?style=for-the-badge&color=blue" alt="license"/></a>
</p>

<p align="center">
  <strong>Your AI Coding Copilot's Best Friend! 🦾</strong>
</p>
<p align="center">
  A lightweight CLI toolkit to bridge the gap between your local code and your favorite AI assistant.
</p>

---

<p align="center">
  <em>"Made for AI developers by an AI developer and an AI assistant."</em>
</p>

---

## 🤔 Why Does DevAssist Exist?

Ever found yourself in a loop of...

*   😭 Trying to paste your entire project into a chat window, only to hit the context limit?
*   😵‍💫 Manually copying and pasting a dozen files, losing all sense of the project's structure?
*   🧩 Pasting just an error message, knowing the AI needs more context but not wanting to find and copy it all?
*   🥱 Writing boring commit messages when an AI could do it better with the right `git diff`?

**DevAssist is here to fix that!** It's a simple, powerful toolkit designed to eliminate the friction between your local development workflow and Large Language Models (LLMs). It programmatically packages your code, diffs, and errors into perfect, context-rich prompts, so you can spend less time copy-pasting and more time building.

## ✨ Features

*   **📦 `export`**: Bundle your entire project structure and code into a single, clean text file.
*   **🔪 `chunk`**: Slice large files into AI-friendly, digestible chunks with a handy table of contents.
*   **🎭 `diff`**: Show a Git-style diff to your AI, providing crucial "before and after" context.
*   **🚑 `error`**: Instantly package an error log with the relevant code snippet that caused it.
*   **✍️ `commit`**: Generate a context-aware `git diff` to have an AI write your commit messages for you.

## 📦 Installation

Install it globally using npm to get access to the `devassist` command from anywhere on your system!

```bash
npm install -g @devassist-for-ai/devassist
```
_**Note:** Even though the package name is scoped, the command you'll run is still the simple and convenient `devassist`!_

## 🛠️ Usage Guide

### `devassist export`
Exports your project code and structure into a single `Code.txt` file.

**Usage:**
```bash
# Export the whole project
devassist export

# Export only specific folders/files to a custom output file
devassist export --only src,package.json --output context.md

# Exclude specific folders
devassist export --exclude tests,dist
```

### `devassist chunk <file>`
Splits a large file into smaller parts, perfect for staying within an AI's context limit.

**Usage:**
```bash
# Chunk a file into default 150-line parts and print to console
devassist chunk src/utils/file-handler.js

# Chunk into 50-line parts and save to a file
devassist chunk src/very-big-file.js --max-lines 50 --output chunks.txt
```

### `devassist diff <file> [commit]`
Generates a diff of a file against the last commit (`HEAD`) or a specific commit hash.

**Usage:**
```bash
# See changes in a file compared to the last commit
devassist diff src/commands/export.js

# Compare against a specific commit
devassist diff src/commands/export.js a1b2c3d
```

### `devassist error <logfile>`
Grabs an error from a log file and bundles it with the surrounding code for easy debugging with an AI.

**Usage:**
```bash
# (First, you need a log file with an error in it!)
# Then run:
devassist error logs/app-error.log
```
_This will output a perfectly formatted block to copy to your AI._

### `devassist commit`
Generates a context bundle from your staged Git changes, ready for an AI to write a commit message.

**Usage:**
```bash
# 1. Stage your changes
git add .

# 2. Generate the context (just the diff)
devassist commit

# 3. Or generate a more detailed context (full file contents)
devassist commit --full
```

## ⚙️ Configuration

For project-specific rules, create a `.aiconfig.json` file in your project's root. It works just like a `.gitignore` file!

**Example `.aiconfig.json`:**
```json
{
  "ignoreDirs": [
    "node_modules",
    ".git",
    "dist",
    "coverage",
    ".next"
  ],
  "ignoreFiles": [
    ".env.local"
  ],
  "includeExt": [
    ".js",
    ".ts",
    ".tsx",
    ".json",
    ".md"
  ]
}
```

## 💬 A Word From The Creators

This is a fun hobby project built to solve a problem we face every day. It's a collaboration between a human developer (**Md Siam Mia**) and the very AI systems it's designed to help (**Gemini**).

We believe this human-AI partnership is the future of software development, and tools like DevAssist are a small step toward making that future more efficient and enjoyable for everyone.

## 🙏 Contributing

Found a bug? Have a great idea? We'd love your help! This is an open-source project for the community. Feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE.md](./LICENSE.md) file for details.