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
const DEFAULT_PIPELINE  = "Tutorial_MCP_LinkUP";

let cachedPipelineId: string = "";

// ── Pipeline status types ─────────────────────────────────────────────────────
// Deepset statuses: DEPLOYED | UNDEPLOYED | DEPLOYMENT_IN_PROGRESS |
//                  UNDEPLOYMENT_IN_PROGRESS | FAILED_TO_DEPLOY | IDLE
// We map these to a simplified set for the frontend
type PipelineStatus = "DEPLOYED" | "ACTIVATING" | "INACTIVE" | "FAILED" | "UNKNOWN";

function mapStatus(raw: string): PipelineStatus {
  switch (raw) {
    case "DEPLOYED":                  return "DEPLOYED";
    case "DEPLOYMENT_IN_PROGRESS":    return "ACTIVATING";
    case "UNDEPLOYED":
    case "UNDEPLOYMENT_IN_PROGRESS":
    case "IDLE":                      return "INACTIVE";
    case "FAILED_TO_DEPLOY":          return "FAILED";
    default:                          return "UNKNOWN";
  }
}

// ── GET /api/status — check pipeline status ───────────────────────────────────
app.get("/api/status", async (req, res) => {
  const workspace = (req.query.workspace as string) || DEFAULT_WORKSPACE;
  const pipeline  = (req.query.pipeline  as string) || DEFAULT_PIPELINE;

  const key = process.env.AIECPLATFORM_API_KEY;
  if (!key) {
    res.status(401).json({ error: "AIECPLATFORM_API_KEY is not set on the server." });
    return;
  }

  try {
    const url = DEEPSET_API_BASE + "/workspaces/" + workspace + "/pipelines/" + pipeline;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(response.status).json({ error: "Failed to get pipeline status: " + text });
      return;
    }

    const json = await response.json();
    const raw    = json.status || "UNKNOWN";
    const status = mapStatus(raw);
    const pipelineId = json.pipeline_id || json.id || "";

    if (pipelineId && !cachedPipelineId) cachedPipelineId = pipelineId;

    res.json({
      status,
      raw_status:  raw,
      pipeline_id: pipelineId,
      desired_status: json.desired_status || "",
      idle_timeout_in_seconds: json.idle_timeout_in_seconds || 1200,
    });

  } catch (err: any) {
    console.error("Status check error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/activate — wake up an inactive pipeline ─────────────────────────
// Uses the /activate endpoint (not /deploy) — this simply wakes the pipeline
// from standby without redeploying it. Returns 204 No Content on success.
app.post("/api/activate", async (req, res) => {
  const workspace = req.body.workspace || DEFAULT_WORKSPACE;
  const pipeline  = req.body.pipeline  || DEFAULT_PIPELINE;

  const key = process.env.AIECPLATFORM_API_KEY;
  if (!key) {
    res.status(401).json({ error: "AIECPLATFORM_API_KEY is not set on the server." });
    return;
  }

  try {
    const url = DEEPSET_API_BASE + "/workspaces/" + workspace + "/pipelines/" + pipeline + "/activate";
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    });

    // 204 No Content — activation request accepted successfully
    if (response.status === 204) {
      res.json({ status: "ACTIVATING", message: "Pipeline activation started." });
      return;
    }

    // 409 Conflict — pipeline is already active
    if (response.status === 409) {
      res.json({ status: "DEPLOYED", message: "Pipeline is already active." });
      return;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error("Activation error " + response.status + ":", text);
      res.status(response.status).json({ error: "Failed to activate pipeline: " + text });
      return;
    }

    // Any other 2xx
    res.json({ status: "ACTIVATING", message: "Pipeline activation started." });

  } catch (err: any) {
    console.error("Activation error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Helper functions ──────────────────────────────────────────────────────────
async function getPipelineId(
  workspace: string, pipeline: string, key: string
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
  workspace: string, pipelineId: string, key: string
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
  url: string, key: string,
  body: { queries: string[]; search_session_id: string }
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(body),
  });
}

// ── POST /api/chat ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const messages  = req.body.messages;
  const workspace = req.body.workspace || DEFAULT_WORKSPACE;
  const pipeline  = req.body.pipeline  || DEFAULT_PIPELINE;

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
          ?
