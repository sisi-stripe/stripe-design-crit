import { spawn } from "child_process";
import { NextRequest, NextResponse } from "next/server";

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

function callClaude(systemPrompt: string, content: string | ContentBlock[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p",
      "--input-format", "stream-json",
      "--output-format", "stream-json",
      "--verbose",
      "--no-session-persistence",
      "--system-prompt", systemPrompt,
      "--model", "claude-sonnet-4-6",
    ];

    const child = spawn("claude", args);
    const message = { type: "user", message: { role: "user", content } };
    child.stdin.write(JSON.stringify(message) + "\n");
    child.stdin.end();

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    child.on("close", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited ${code}: ${stderr}`));
        return;
      }
      for (const line of stdout.split("\n")) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.type === "result" && parsed.subtype === "success") {
            resolve(parsed.result);
            return;
          }
        } catch { /* skip non-JSON lines */ }
      }
      reject(new Error("No result found in Claude CLI output"));
    });
  });
}

const TASTE_SYSTEM_PROMPT = `You are a design critic applying Stripe's taste principles, informed by Yuliya's design philosophy for the Stripe Dashboard.

Your job is to review designs and provide structured, actionable critique using these principles:

1. **Activation-state calibration**: Content and features must match the user's activation state. Early users need tasks + education + info together. Activated users need activity modules. Never try to be everything at once — surfacing the wrong content for the activation state is a design failure.

2. **No hard boundaries or gradients on overlays/floaties**: Avoid designs where an overlay or floatie creates hard visual separation between UI layers, or greys out the dashboard behind it. Users must maintain their sense of place. No gradients on these surfaces — be extremely intentional. Default is no gradient.

3. **White space must be earned**: Don't fill space for filling's sake. If content moves from a small surface to a large one, the layout must be rethought from scratch — not stretched or padded. Ask: "What is this surface's job at this size, in this position, for this user at this activation state?"

4. **Icons earn their place or are removed**: Icons should aid immediate recognition. If a reviewer has to think about what an icon means, it's not helping. Removing unclear icons is always better than keeping them for visual consistency.

5. **Purposeful density**: No decorative elements. Every element either communicates something necessary or it doesn't belong. Padding and decoration are not value — clarity is.

6. **Sail UI patterns**: Respect Stripe Dashboard component conventions. Use established patterns before inventing new ones. Novelty requires justification.

7. **Functional motion only**: Animations must serve comprehension or mark a genuine moment. Looping animations are almost always wrong — they pull attention after the user has already registered the moment.

When critiquing, be specific and actionable. Reference the principles. Be direct — this is internal critique between designers, not client communication.`;

const CRITIQUE_PROMPT = `Generate 4–6 taste critique items for this design. Include at least one "kudos" item that calls out a genuine design strength. Return ONLY a raw JSON array — no markdown, no code fences, no explanation. Format:
[
  {
    "level": "kudos|question|consider|blocking",
    "text": "specific, actionable critique (1–2 sentences)",
    "rationale": "why this matters per taste principles (1 sentence)",
    "figmaNote": "short version for Figma comment, under 120 chars",
    "bbox": { "x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0 }
  }
]

The bbox field uses normalized coordinates (0–1) relative to image dimensions, identifying the specific region the feedback refers to. Use a tight bounding box when feedback targets a specific element; use full image (x:0, y:0, width:1, height:1) for holistic feedback.

Focus on taste-specific issues: activation-state calibration, earned white space, icon clarity, gradient/overlay treatment, visual boundaries, purposeful density, Sail UI alignment. Kudos should call out genuine design strengths using the same taste lens.`;

function extractJsonArray(raw: string): unknown[] {
  // Strip markdown code fences then find the first JSON array in the response
  const stripped = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "");
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON array found");
  return JSON.parse(stripped.slice(start, end + 1));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figmaUrl, humanFeedback, sessionTitle, conversationHistory, userReply, imageBase64, imageMediaType } = body;

    // Refinement mode: user replied to an AI suggestion
    if (conversationHistory && userReply) {
      // Flatten conversation history into the prompt since CLI is single-turn
      const historyText = (conversationHistory as { role: string; text: string }[])
        .map((m) => `${m.role === "user" ? "Designer" : "Critic"}: ${m.text}`)
        .join("\n\n");
      const prompt = `${historyText}\n\nDesigner: ${userReply}`;

      const refinementSystem =
        TASTE_SYSTEM_PROMPT +
        "\n\nYou are in a back-and-forth conversation refining a single design critique item. The designer has responded to your suggestion with context. Acknowledge what they said, adjust your recommendation if their context changes your assessment, and give a refined take. Be conversational and concise (2–4 sentences). Do not return JSON — reply naturally.";

      const text = await callClaude(refinementSystem, prompt);
      return NextResponse.json({ type: "refinement", text });
    }

    // Image critique mode: vision-based critique from a dropped/uploaded image
    if (imageBase64) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const mediaType = validTypes.includes(imageMediaType)
        ? (imageMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp")
        : "image/png";
      // Strip data URL prefix if present (data:image/png;base64,<data>)
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;

      const raw = await callClaude(TASTE_SYSTEM_PROMPT, [
        { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
        { type: "text", text: `Design title: "${sessionTitle || "Untitled"}"\n\n${CRITIQUE_PROMPT}` },
      ]);
      let items;
      try {
        items = extractJsonArray(raw);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
      }
      return NextResponse.json({ type: "generation", items });
    }

    // Figma/text generation mode: generate 4-6 taste critique items
    const lines: string[] = [];
    if (sessionTitle) lines.push(`Design title: "${sessionTitle}"`);
    if (figmaUrl) lines.push(`Figma URL: ${figmaUrl}`);

    if (humanFeedback && humanFeedback.length > 0) {
      lines.push("\nHuman reviewer feedback so far:");
      humanFeedback.forEach(
        (fb: { reviewerName: string; level: string; text: string }) => {
          lines.push(`- [${fb.level.toUpperCase()}] ${fb.reviewerName}: ${fb.text}`);
        }
      );
    }

    lines.push(`\n${CRITIQUE_PROMPT}`);

    const raw = await callClaude(TASTE_SYSTEM_PROMPT, lines.join("\n"));

    let items;
    try {
      items = extractJsonArray(raw);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ type: "generation", items });
  } catch (error) {
    console.error("Taste API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
