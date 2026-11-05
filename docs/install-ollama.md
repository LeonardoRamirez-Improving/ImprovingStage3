# Ollama Server Installation

Ollama is an open-source AI model server. The `ollama` command is used by `ollama.js` in this project.

## Requirements

- An active Ollama server running locally or remotely
- Internet connection

---

## Installation

Visit the official Ollama documentation for the latest installation instructions:

- **Download page**: [ollama.com/download](https://ollama.com/download)
- **Documentation**: [ollama.com/docs](https://ollama.com/docs)

After installing, verify the CLI is available:

```bash
ollama --version
```

Alternatively, you can utilize a GUI based ollama server provider like [LM Studio](https://lmstudio.ai/).
Set up in the `Developer Mode`, you can configure the server to listen on a specific port and IP address.
See [their Server Docs](https://lmstudio.ai/docs/developer/core/server) for more information.


## Verify Installation

```bash
curl -X POST http://localhost:{OLLAMA_PORT}/api/v1/chat -H "Content-Type: application/json" -d '{"model":"{YOUR_MODEL_NAME}","input":"Hello"}'
```

---

## Usage in This Project

This project uses `ollama.js` which calls:

```bash

# Provider mode
curl -X POST http://localhost:{OLLAMA_PORT}/api/v1/chat -H "Content-Type: application/json" -d '{"model":"{YOUR_MODEL_NAME}","input":"your prompt"}'

# Grader mode (system + user messages concatenated)
curl -X POST http://localhost:{OLLAMA_PORT}/api/v1/chat -H "Content-Type: application/json" -d '{"model":"{YOUR_MODEL_NAME}","input":"system instructions\n\nuser message"}'
```

> **Note:** Ollama does not support a `--system-prompt` flag, so `ollama.js` concatenates the system message and user message into a single prompt in grader mode.

---

## More Information

- Documentation: [ollama.com/docs](https://ollama.com/docs)
