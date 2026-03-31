import { spawn } from "child_process";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are implementing design improvements to a Stripe Dashboard design in Figma.

You will receive a design (a Figma URL and/or a screenshot) and a list of specific feedback items to implement.

Your steps:
1. If a Figma URL is provided, use figma_get_design_context to understand the current file structure, then use use_figma to make precise, targeted changes for each feedback item.
2. If only a screenshot is provided (no Figma URL), use figma_create_new_file to create a new file, then use use_figma to recreate the design with the improvements already applied.
3. When complete, output the Figma URL on its own line in this exact format: FIGMA_URL: <url>

Be surgical — implement only what is specified. Do not redesign or introduce unrequested changes.`;

function sseChunk(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { figmaUrl, imageBase64, imageMediaType, feedbackItems, projectTitle } = body;

  const stream = new ReadableStream({
    start(controller) {
      const feedbackText = (feedbackItems as { level: string; text: string; rationale?: string }[])
        .map((f, i) => `${i + 1}. [${f.level.toUpperCase()}] ${f.text}${f.rationale ? `\nSuggested change: ${f.rationale}` : ""}`)
        .join("\n\n");

      const promptLines: string[] = [];
      if (projectTitle) promptLines.push(`Design: "${projectTitle}"`);
      if (figmaUrl) promptLines.push(`Figma URL: ${figmaUrl}`);
      promptLines.push(`\nFeedback to implement:\n${feedbackText}`);
      promptLines.push("\nImplement these changes in Figma now. End with FIGMA_URL: <url>");

      const promptText = promptLines.join("\n");

      type ContentBlock =
        | { type: "text"; text: string }
        | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

      const content: ContentBlock[] | string = imageBase64
        ? [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: (imageMediaType as string) || "image/png",
                data: imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64,
              },
            },
            { type: "text", text: promptText },
          ]
        : promptText;

      const message = { type: "user", message: { role: "user", content } };

      const args = [
        "-p",
        "--input-format", "stream-json",
        "--output-format", "stream-json",
        "--verbose",
        "--no-session-persistence",
        "--system-prompt", SYSTEM_PROMPT,
        "--model", "claude-sonnet-4-6",
      ];

      const child = spawn("claude", args);
      child.stdin.write(JSON.stringify(message) + "\n");
      child.stdin.end();

      let buffer = "";

      child.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);

            if (parsed.type === "assistant" && Array.isArray(parsed.message?.content)) {
              for (const block of parsed.message.content) {
                if (block.type === "text" && block.text?.trim()) {
                  controller.enqueue(sseChunk({ type: "progress", text: block.text }));
                  const urlMatch = (block.text as string).match(/FIGMA_URL:\s*(https:\/\/[^\s]+)/);
                  if (urlMatch) {
                    controller.enqueue(sseChunk({ type: "complete", figmaUrl: urlMatch[1] }));
                  }
                } else if (block.type === "tool_use" && block.name) {
                  const label = (block.name as string)
                    .replace("mcp__plugin_dante_t__", "")
                    .replace(/_/g, " ");
                  controller.enqueue(sseChunk({ type: "tool", label }));
                }
              }
            }

            if (parsed.type === "result" && parsed.subtype === "success") {
              const result: string = parsed.result ?? "";
              const urlMatch = result.match(/https:\/\/(?:www\.)?figma\.com\/[^\s)>\n]+/);
              controller.enqueue(sseChunk({ type: "complete", figmaUrl: urlMatch?.[0] ?? null }));
              try { controller.close(); } catch { /* already closed */ }
            }
          } catch { /* skip non-JSON lines */ }
        }
      });

      child.stderr.on("data", (chunk: Buffer) => {
        console.error("implement stderr:", chunk.toString());
      });

      child.on("close", (code: number) => {
        if (code !== 0) {
          controller.enqueue(sseChunk({ type: "error", message: `Claude exited with code ${code}` }));
        }
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
