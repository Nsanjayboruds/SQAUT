# AI Usage Guide

The AI Code Review Assistant is designed to be provider-agnostic. It communicates with AI models using the standard OpenAI Chat Completions API format (`/v1/chat/completions`).

## Supported Providers

### 1. OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **Model**: `gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`
- **Requires API Key**: Yes

### 2. LM Studio (Local AI)
- **Base URL**: `http://localhost:1234/v1` (Default)
- **Model**: Must match the model loaded in LM Studio.
- **Requires API Key**: No (leave empty or use dummy value)
- **Note**: Ensure the LM Studio local server is running.

### 3. Ollama (Local AI)
- **Base URL**: `http://localhost:11434/v1`
- **Model**: e.g., `llama3.1`, `codellama`, `mistral`
- **Requires API Key**: No
- **Note**: Ollama now natively supports the OpenAI API format on the `/v1` endpoint.

## Configuring a Provider

1. Navigate to **Settings > AI Providers** in the dashboard.
2. Click **Add Provider**.
3. Select a preset (OpenAI, LM Studio, Ollama) or Custom.
4. Provide your API key if required. It will be encrypted before being saved to the database.
5. Click **Test** on the provider card to verify the connection.

## Context Window Limits

Large projects can easily exceed an AI model's context window. To prevent API errors:
- The system limits review context to roughly **30,000 characters**. Files are truncated if they exceed this limit.
- The chat system uses a basic **Keyword Retrieval System**: it scores files based on path and content matches against your prompt and only sends the top 10 most relevant files to the AI.
- For deep architectural analysis of massive codebases, consider using models with larger context windows (e.g., `gpt-4-turbo` or a locally hosted 32K context model).

## Prompt Engineering

The system uses specialized prompts for different tasks:
- **Security Review**: Instructs the AI to look for injection flaws, hardcoded secrets, and auth bypasses.
- **Performance Review**: Targets N+1 queries, memory leaks, and inefficient algorithms.
- **Code Quality Review**: Focuses on maintainability, DRY principles, and clean architecture.

All review prompts strictly enforce a JSON output schema. The `AIService` includes fallback parsing logic in case the AI model fails to format the JSON perfectly.
