# Google Antigravity CLI (`agy`) Installation

Google Antigravity CLI (`agy`) is Google's AI-first development CLI. The `agy` command is used by `agy.js` in this project.

## Requirements

- Google account for authentication
- Internet connection

---

## Installation & Setup

Please refer to the official Google Antigravity installation instructions to set up the `agy` CLI on your platform:

- Main Documentation: [antigravity.google/docs](https://antigravity.google/docs)

Once installed, verify that the CLI is in your system PATH:

```bash
agy --version
```

---

## Authentication

After installation, launch the CLI to authenticate and log in to your Google account:

```bash
agy
```

On first run, press `Enter` to open the browser OAuth flow, authenticate with your Google account, and copy/paste the authentication code back into your terminal.

---

## Verify Installation

Ensure the CLI works non-interactively in print/timeout mode:

```bash
agy -p "What is 2+2?"
```

---

## Usage in This Project

This project uses `agy.js` which calls:

```bash
# Provider mode
agy -p "your prompt" --dangerously-skip-permissions

# With a specific model
agy -p "your prompt" --dangerously-skip-permissions --model gemini-3.5-flash
```

> **Note on Permissions**: The `agy` CLI uses `--dangerously-skip-permissions` to auto-approve tool execution and prevent blocking interactive prompts during promptfoo evaluations.

---

## More Information

- Documentation: [antigravity.google/docs](https://antigravity.google/docs)
