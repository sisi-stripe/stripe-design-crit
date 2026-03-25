import { NextRequest, NextResponse } from "next/server";

function extractFigmaFileKey(url: string): string | null {
  let target = url;

  // Decode embed URL format: ?url=https%3A%2F%2Fwww.figma.com%2Fdesign%2F{key}%2F...
  if (url.includes("figma.com/embed") || url.includes("embed_host=")) {
    const match = url.match(/[?&]url=([^&]+)/);
    if (match) {
      target = decodeURIComponent(match[1]);
    }
  }

  // Match /design/{key}/ or /file/{key}/
  const match = target.match(/figma\.com\/(?:design|file)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const { figmaUrl, comments } = await request.json();
    const token = process.env.FIGMA_ACCESS_TOKEN;

    if (!token || token === "your_figma_personal_access_token_here") {
      return NextResponse.json(
        { error: "FIGMA_ACCESS_TOKEN not configured in .env.local" },
        { status: 500 }
      );
    }

    const fileKey = extractFigmaFileKey(figmaUrl);
    if (!fileKey) {
      return NextResponse.json(
        { error: `Could not extract Figma file key from URL: ${figmaUrl}` },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      comments.map(
        async (comment: { level: string; text: string; figmaNote?: string }) => {
          const label = comment.level.toUpperCase();
          const body = comment.figmaNote
            ? `[${label}] ${comment.figmaNote} (taste review)`
            : `[${label}] ${comment.text} (taste review)`;

          const res = await fetch(
            `https://api.figma.com/v1/files/${fileKey}/comments`,
            {
              method: "POST",
              headers: {
                "X-Figma-Token": token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message: body }),
            }
          );

          const data = await res.json();
          return { ok: res.ok, status: res.status, data };
        }
      )
    );

    const allOk = results.every((r) => r.ok);
    return NextResponse.json({ success: allOk, results, fileKey });
  } catch (error) {
    console.error("Figma comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
