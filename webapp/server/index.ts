import express from "express";
import cors from "cors";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const DEEPSET_API_BASE = "https://api.cloud.deepset.ai/api/v1";
const DEFAULT_WORKSPACE = "Test";
const DEFAULT_PIPELINE = "Tutorial_MCP_LinkUP";

let cachedPipelineId: string = "";

async function getPipelineId(
  workspace: string,
  pipeline: string,
  key: string
): Promise<string> {
  const url = DEEPSET_API_BASE + "/workspaces/" + workspace + "/pipelines/" + pipeline;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to fetch pipeline: " + res.status + " " + text);
  }
  const json = await res.json();
  const pipelineId = json.pipeline_id || json.id;
  if (!pipelineId) throw new Error("Pipeline ID not found: " + JSON.stringify(json));
  console.log("Pipeline ID:", pipelineId);
  return pipelineId;
}

async function createSearchSession(
  workspace: string,
  pipelineId: string,
  key: string
): Promise<string> {
  const url = DEEPSET_API_BASE + "/workspaces/" + workspace + "/search_sessions";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ pipeline_id: pipelineId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to create session: " + res.status + " " + text);
  }
  const json = await res.json();
  console.log("Session created:", json.search_session_id);
  return json.search_session_id;
}

async function callDeepsetChat(
  url: string,
  key: string,
  body: { queries: string[]; search_session_id: string }
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(body),
  });
}

app.post("/api/chat", async (req, res) => {
  const messages = req.body.messages;
  const workspace = req.body.workspace || DEFAULT_WORKSPACE;
  const pipeline = req.body.pipeline || DEFAULT_PIPELINE;

  const key = process.env.AIECPLATFORM_API_KEY;
  if (!key) {
    res.status(401).json({ error: "AIECPLATFORM_API_KEY is not set on the server." });
    return;
  }

  try {
    if (!cachedPipelineId) {
      cachedPipelineId = await getPipelineId(workspace, pipeline, key);
    }

    let sessionId = await createSearchSession(workspace, cachedPipelineId, key);
    const lastMessage = messages[messages.length - 1];
    const url = DEEPSET_API_BASE + "/workspaces/" + workspace + "/pipelines/" + pipeline + "/chat";

    let body = { queries: [lastMessage.content], search_session_id: sessionId };
    console.log("Calling /chat:", JSON.stringify(body));

    let upstream = await callDeepsetChat(url, key, body);

    if (upstream.status === 500) {
      console.log("Got 500 — retrying with fresh session...");
      cachedPipelineId = "";
      cachedPipelineId = await getPipelineId(workspace, pipeline, key);
      sessionId = await createSearchSession(workspace, cachedPipelineId, key);
      body = { queries: [lastMessage.content], search_session_id: sessionId };
      upstream = await callDeepsetChat(url, key, body);
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Deepset error:", errText);
      cachedPipelineId = "";
      const userMessage =
        upstream.status === 500
          ? "The pipeline encountered a temporary error. Please try your question again."
          : upstream.status === 408 || upstream.status === 503
          ? "The pipeline timed out. Please try again."
          : upstream.status === 429
          ? "Too many requests. Please wait a moment and try again."
          : "Request failed (" + upstream.status + "). Please try again.";
      res.status(upstream.status).json({ error: userMessage });
      return;
    }

    const json = await upstream.json();
    console.log("Deepset response:", JSON.stringify(json));

    const answer =
      (json.results && json.results[0] && json.results[0].answers && json.results[0].answers[0] && json.results[0].answers[0].answer) ||
      (json.results && json.results[0] && json.results[0].answer) ||
      (json.answers && json.answers[0] && json.answers[0].answer) ||
      JSON.stringify(json);

    res.json({ answer, sessionId });

  } catch (err: any) {
    console.error("Server error:", err.message);
    cachedPipelineId = "";
    res.status(500).json({ error: "The pipeline encountered a temporary error. Please try your question again." });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

const distPath = path.join(__dirname, "../../client/dist");
app.use(express.static(distPath));

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT || 3000;
createServer(app).listen(parseInt(PORT.toString()), "0.0.0.0", () => {
  console.log("Ask LinkUP server running on port " + PORT);
});
