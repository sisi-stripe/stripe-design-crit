import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const CRITIQUE_PROMPT = `Generate 4–6 taste critique items for this design. Return ONLY a raw JSON array — no markdown, no code fences, no explanation. Format:
[
  {
    "level": "kudos|question|consider|blocking",
    "text": "specific, actionable critique (1–2 sentences)",
    "rationale": "why this matters per taste principles (1 sentence)",
    "figmaNote": "short version for Figma comment, under 120 chars"
  }
]

Focus on taste-specific issues: activation-state calibration, earned white space, icon clarity, gradient/overlay treatment, visual boundaries, purposeful density, Sail UI alignment. Skip generic UX issues unless they directly relate to these principles.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { figmaUrl, humanFeedback, sessionTitle, conversationHistory, userReply, imageBase64, imageMediaType } = body;

    // Refinement mode: user replied to an AI suggestion
    if (conversationHistory && userReply) {
      const messages: Anthropic.MessageParam[] = [
        ...conversationHistory.map((m: { role: string; text: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.text,
        })),
        { role: "user", content: userReply },
      ];

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system:
          TASTE_SYSTEM_PROMPT +
          "\n\nYou are in a back-and-forth conversation refining a single design critique item. The designer has responded to your suggestion with context. Acknowledge what they said, adjust your recommendation if their context changes your assessment, and give a refined take. Be conversational and concise (2–4 sentences). Do not return JSON — reply naturally.",
        messages,
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
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

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: TASTE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64Data },
              },
              {
                type: "text",
                text: `Design title: "${sessionTitle || "Untitled"}"\n\n${CRITIQUE_PROMPT}`,
              },
            ],
          },
        ],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "[]";
      let items;
      try {
        const cleaned = raw.replace(/^```json\s*/m, "").replace(/^```\s*/m, "").replace(/```\s*$/m, "").trim();
        items = JSON.parse(cleaned);
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

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: TASTE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: lines.join("\n") }],
    });

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "[]";

    let items;
    try {
      const cleaned = raw
        .replace(/^```json\s*/m, "")
        .replace(/^```\s*/m, "")
        .replace(/```\s*$/m, "")
        .trim();
      items = JSON.parse(cleaned);
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
