import type { Handler } from "@netlify/functions";
import { VertexAI } from "@google-cloud/vertexai";
import { createCorsHandler } from "./cors-utils";

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export const handler: Handler = async (event) => {
  const cors = createCorsHandler(event);

  if (event.httpMethod === "OPTIONS") {
    return cors.handleOptions("POST,OPTIONS");
  }

  if (event.httpMethod !== "POST") {
    return cors.response(405, { error: "Method not allowed" });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const userPrompt: string = payload.prompt || "";
    if (!userPrompt) return cors.response(400, { error: "Missing prompt" });

    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || "trialcliniq",
      location: process.env.VERTEX_AI_LOCATION || "us-central1",
    });

    const generativeModel = vertexAI.getGenerativeModel({
      model: process.env.VERTEX_AI_MODEL || "gemini-1.5-pro",
    });

    const systemInstruction =
      "You score clinical trial eligibility and fit. The score MUST be calculated as the SUM of these components: Condition match (0-40), Demographics (0-15), Exclusions (0-20), Medications (0-10), Location (0-10), Status (0-5). Review ALL patient conditions, medications, and allergies listed. Output ONLY valid JSON with integer score (0-100 = sum of components) and rationale (<=160 chars showing calculation).";

    const prompt = `${systemInstruction}\n\n${userPrompt}`;

    let content: string;
    try {
      const result = await generativeModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      content = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } catch (apiErr: any) {
      console.error("ai-scorer: Vertex AI API error:", apiErr);
      return cors.response(500, { error: String(apiErr?.message || apiErr) });
    }

    // Strip markdown code fences if present
    const jsonText = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let out: any = {};
    try {
      out = jsonText ? JSON.parse(jsonText) : {};
    } catch {
      // Model returned something we can't parse -- surface this instead of silently returning 0
      console.error("ai-scorer: failed to parse Vertex AI response:", content?.slice(0, 200));
      return cors.response(502, { error: "Unparseable response from scoring model", raw: content?.slice(0, 300) });
    }
    if (typeof out.score === "undefined") {
      return cors.response(502, { error: "Model response missing score field", raw: content?.slice(0, 300) });
    }
    const scoreNum = clamp(Math.round(Number(out.score)), 0, 100);
    const rationale = String(out.rationale || "");

    return cors.response(200, { score: scoreNum, rationale });
  } catch (e: any) {
    return cors.response(500, { error: String(e?.message || e || "Unknown error") });
  }
};
