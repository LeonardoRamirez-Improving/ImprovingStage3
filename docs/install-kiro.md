# Kiro CLI Installation

Kiro is Amazon's AI coding assistant for the terminal. The `kiro-cli` command is used by `kiro.js` in this project.

## Requirements

- An active Kiro account at [kiro.dev](https://kiro.dev)
- `KIRO_API_KEY` environment variable set for headless/non-interactive operation
- Internet connection

---

## Installation

Visit the official Kiro documentation for the latest installation instructions:

- **Download page**: [kiro.dev/downloads](https://kiro.dev/downloads)
- **Documentation**: [kiro.dev/docs](https://kiro.dev/docs)

After installing, verify the CLI is available:

```bash
kiro-cli --version
```

---

## Authentication

Set your Kiro API key as an environment variable before running evaluations:

```bash
# macOS / Linux
export KIRO_API_KEY="your-api-key-here"

# Windows PowerShell
$env:KIRO_API_KEY = "your-api-key-here"
```

---

## Verify Installation

```bash
kiro-cli --version
kiro-cli chat --no-interactive "What is 2+2?"
```

---

## Usage in This Project

This project uses `kiro.js` which calls:

```bash
# Provider mode
kiro-cli chat --no-interactive "your prompt" --model claude-sonnet-4.6

# Grader mode (system + user messages concatenated)
kiro-cli chat --no-interactive "system instructions\n\nuser message" --model claude-sonnet-4.6
```

> **Note:** Kiro CLI does not support a `--system-prompt` flag, so `kiro.js` concatenates the system message and user message into a single prompt in grader mode.

---

## More Information

- Documentation: [kiro.dev/docs](https://kiro.dev/docs)
