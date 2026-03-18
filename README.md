# AI Benchmark Dashboard

Production-ready dashboard for analyzing AI prompts, comparing models, estimating costs/energy, and optimizing prompt quality.

## Architecture

```
├── server/          # Node.js + Express backend
│   ├── controllers/ # Route handlers
│   ├── services/    # Business logic
│   ├── utils/       # Helpers (token counting, pricing, energy)
│   └── mcp/         # External data fetching modules
├── client/          # React + Tailwind frontend
│   ├── components/  # Reusable UI components
│   ├── pages/       # Page-level views
│   └── hooks/       # Custom React hooks
```

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Create server/.env with your OpenAI key
echo "OPENAI_API_KEY=sk-your-key" > server/.env

# Run both server & client
npm run dev
```

Server runs on `http://localhost:4000`, Client on `http://localhost:3000`.

## API Endpoints

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| POST   | /api/analyze-prompt | Full prompt analysis pipeline     |
| GET    | /api/models        | List available models & pricing   |
| GET    | /api/health        | Server health check               |

## Features

- **Prompt Analysis** — tokenize, cost-estimate, and score any prompt
- **Multi-Model Execution** — run against multiple models (real or simulated)
- **Token Counting** — accurate GPT tokenization via tiktoken
- **Cost Estimation** — dynamic pricing per model/token type
- **Energy Estimation** — carbon-aware compute estimates
- **Quality Scoring** — LLM-graded output evaluation
- **Optimization Suggestions** — actionable prompt improvements
