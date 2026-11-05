#!/usr/bin/env node
// Combined Claude Code CLI provider and grader for promptfoo
//
// Auto-detects mode based on prompt format:
// - Grader mode: Prompt is JSON array [{role, content}, ...]
// - Provider mode: Prompt is plain text
//
// Grader: Parses JSON chat array, routes system message via --system-prompt
// Provider: Passes prompt directly to Claude CLI

const { spawnSync } = require('child_process');

const prompt = process.argv[2];
const options = process.argv[3];
const context = process.argv[4];

// Detect mode: if prompt looks like a JSON array, use grader mode
let isGraderMode = false;
try {
  const parsed = JSON.parse(prompt);
  if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].role) {
    isGraderMode = true;
  }
} catch (e) {
  // Not JSON, so provider mode
}

if (isGraderMode) {
  // ===== GRADER MODE =====
  // Parse the JSON chat message array that promptfoo sends to graders
  let systemMsg, userMsg;
  try {
    const messages = JSON.parse(prompt);
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessage = messages.find(m => m.role === 'user');

    if (systemMessage && userMessage) {
      systemMsg = systemMessage.content;
      userMsg = userMessage.content;
    } else {
      throw new Error('Missing system or user message');
    }
  } catch (e) {
    // Fallback: treat the whole thing as a user message
    systemMsg = 'You are an evaluator. Respond with only valid JSON: {"pass": bool, "score": 0.0-1.0, "reason": "string"}';
    userMsg = prompt;
  }

  // --system-prompt replaces Claude Code's default system prompt entirely
  const result = spawnSync('claude', ['-p', userMsg, '--system-prompt', systemMsg, '--model', 'haiku'], {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(result.stdout || result.stderr);
    process.exit(result.status || 1);
  }

  console.log(result.stdout);
} else {
  // ===== PROVIDER MODE =====
  // Parse OPTIONS to get model from config
  let model = 'haiku'; // Default model
  if (options && options !== '{}') {
    try {
      const optionsObj = JSON.parse(options);
      if (optionsObj.config && optionsObj.config.model) {
        model = optionsObj.config.model;
      }
    } catch (e) {
      // If JSON parsing fails, use default
      model = 'haiku';
    }
  }

  // Build command with optional model flag
  const args = ['-p', prompt];
  if (model) {
    args.push('--model', model);
  }

  const result = spawnSync('claude', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(result.stdout || result.stderr);
    process.exit(result.status || 1);
  }

  console.log(result.stdout);
}
