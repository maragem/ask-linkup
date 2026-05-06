# Ask LinkUP

**AI-powered real-time web research assistant for European Commission staff**

Built on the AI@EC Platform (Haystack Enterprise) · GPT@EC LLM · Linkup AI Search API
Unit DIGIT.B1 – Data, Artificial Intelligence & Web · European Commission

---

## What this is

Ask LinkUP is a conversational AI assistant that lets EC staff search the live web and extract page content in real time using plain language questions. Unlike standard AI assistants that rely on training data, Ask LinkUP retrieves current information — news, reports, prices, events — directly from the web at the moment you ask.

It demonstrates how to integrate an **externally-hosted MCP server** (Linkup's production search API) with the AI@EC Platform without deploying any additional infrastructure. The only deployment required is the web app itself.

---

## Key difference from EUR-Lex tutorial

| | Ask EU-Law | Ask LinkUP |
|--|--|--|
| MCP server | Self-hosted on Railway | Hosted by Linkup (no deployment needed) |
| Data source | EUR-Lex CELLAR (static legal DB) | Live web (real-time) |
| Extra API key | None | Linkup API key (free tier available) |
| Railway services | 2 (MCP + webapp) | 1 (webapp only) |

---

## Architecture

```
Browser
  └── Web App (Railway)          React + Express
        └── AI@EC Platform       Haystack Enterprise (Deepset Cloud)
              └── Agent          GPT@EC LLM (api.tech.ec.europa.eu/ecgpt/v1)
                    └── MCP      Linkup MCP Server (mcp.linkup.so/mcp)
                          └── Web  The live internet
```

---

## Repository structure

```
ask-linkup/
├── webapp/                  Web application
│   ├── server/index.ts      Express backend — proxies to Deepset Cloud /chat
│   ├── tsconfig.server.json
│   ├── client/              React frontend
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── index.css         Europa Design System styles
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts        Chat logic and history
│   │   │   │   └── useSettings.tsx   Workspace/pipeline settings
│   │   │   ├── components/
│   │   │   │   └── Header.tsx        EC Europa-branded header
│   │   │   └── pages/
│   │   │       ├── ChatPage.tsx      Chat interface with history sidebar
│   │   │       ├── SettingsPage.tsx  Workspace and pipeline name settings
│   │   │       └── AboutPage.tsx     Architecture documentation
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── package.json
│
├── pipeline.yaml            Haystack Enterprise pipeline definition
├── Dockerfile.webapp        Multi-stage Docker build
└── README.md
```

---

## Linkup tools

| Tool | Purpose |
|------|---------|
| `linkup-search` | Search the web in real time. Supports standard depth (parallel searches) and deep depth (iterative multi-URL retrieval) |
| `linkup-fetch` | Fetch and extract the full content of a specific URL as Markdown |

**Data source:** The live internet via [Linkup AI Search API](https://www.linkup.so) — real-time, always current.

---

## Deployment

### Prerequisites

- Railway account connected to your GitHub repository
- AI@EC Platform workspace (`Test`) with the pipeline deployed
- Linkup API key (register free at linkup.so — €5 free credit on signup)
- GPT@EC API key for the pipeline
- Deepset Cloud API key for the web app backend

---

### Step 1 — Get a Linkup API key

1. Go to [app.linkup.so](https://app.linkup.so) and register with your EC or personal email
2. After registration you receive €5 free credit — enough for hundreds of searches
3. Go to **API Keys** in your Linkup dashboard and generate a new key
4. Copy the key — you will add it to the AI@EC Platform workspace secrets in Step 2

---

### Step 2 — Configure the AI@EC Platform workspace

1. Log in to the AI@EC Platform and open your workspace (`Test`)
2. Go to **Settings → Secrets** and add:
   - `LINKUP_API_KEY` = your Linkup API key from Step 1
   - `GPTEC_API_KEY_v1` = your GPT@EC API key
3. Go to **Pipelines → + New Pipeline**, name it `Tutorial_MCP_LinkUP`
4. Switch to YAML view, paste the contents of `pipeline.yaml`, click **Save**
5. Click **Deploy** and wait for status **DEPLOYED**
6. Test it in the **Playground** — ask "What is the latest news about the EU AI Act?"

> **Important:** The pipeline YAML must NOT contain any `streaming_callback` lines. The provided `pipeline.yaml` is already correct.

---

### Step 3 — Get your AI@EC Platform API key

1. In the AI@EC Platform workspace, go to **Settings → API Keys**
2. Click **Generate API Key**, name it `ask-linkup-webapp`
3. Copy the key — you will set it as a Railway environment variable in Step 4

---

### Step 4 — Deploy the web app on Railway

1. Go to [railway.app](https://railway.app) → Login with GitHub
2. Create a new project → **+ New** → **GitHub Repo** → select `ask-linkup`
3. In the service **Settings → Build**, set:
   - Root Directory: *(leave blank — repo root)*
   - Dockerfile Path: `Dockerfile.webapp`
4. In **Variables**, add:
   - `AIECPLATFORM_API_KEY` = your AI@EC Platform API key from Step 3
5. In **Settings → Networking**, click **Generate Domain**
6. Wait for deployment to show **Active**

---

### Step 5 — Configure and test

1. Open your Railway web app URL
2. Go to **Settings** and confirm:
   - Workspace name: your workspace name
   - Pipeline name: `Tutorial_MCP_LinkUP`
3. Go to **Chat** and ask a test question:
   > "What are the latest EU AI policy developments this week?"
4. The agent will call `linkup-search` and return a real-time answer with source links

---

## API key security model

| Key | Where it lives | Who sets it |
|-----|---------------|-------------|
| `AIECPLATFORM_API_KEY` | Railway environment variable | App administrator |
| `GPTEC_API_KEY_v1` | AI@EC Platform workspace secret | AI engineer |
| `LINKUP_API_KEY` | AI@EC Platform workspace secret | App administrator |

None of these keys are ever sent to the browser.

---

## Local development

```bash
cd webapp
npm install
cd client && npm install && cd ..
AIECPLATFORM_API_KEY=your-key npm run dev
```

---

## Known limitations

- **No token streaming** — answers appear all at once after the agent completes all tool calls (typically 10–30 seconds)
- **Linkup costs** — each deep search costs €0.05, standard search €0.005. Monitor your Linkup dashboard for usage
- **Web availability** — some pages block automated scraping. If linkup-fetch fails on a URL, try linkup-search instead

---

*AI@EC Platform Tutorial · Ask LinkUP · Unit DIGIT.B1 – Data, Artificial Intelligence & Web · European Commission · v1.0.0*
