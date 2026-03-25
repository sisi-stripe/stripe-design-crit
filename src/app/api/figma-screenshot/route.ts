import { NextRequest, NextResponse } from "next/server";

function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  // https://www.figma.com/design/:fileKey/:name?node-id=1-2
  // https://www.figma.com/file/:fileKey/:name?node-id=1-2
  const fileMatch = url.match(/figma\.com\/(?:design|file)\/([^/?]+)/);
  if (!fileMatch) return null;
  const fileKey = fileMatch[1];

  const nodeMatch = url.match(/node-id=([^&]+)/);
  if (!nodeMatch) return null;
  const nodeId = decodeURIComponent(nodeMatch[1]).replace(/-/g, ":");

  return { fileKey, nodeId };
}

export async function POST(request: NextRequest) {
  try {
    const { figmaUrl } = await request.json();

    const parsed = parseFigmaUrl(figmaUrl);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid Figma URL — make sure it includes a node-id" }, { status: 400 });
    }

    const token = process.env.FIGMA_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "FIGMA_ACCESS_TOKEN not configured in .env.local" }, { status: 500 });
    }

    // Ask Figma for a signed image URL for this node
    const imagesRes = await fetch(
      `https://api.figma.com/v1/images/${parsed.fileKey}?ids=${encodeURIComponent(parsed.nodeId)}&format=png&scale=2`,
      { headers: { "X-Figma-Token": token } }
    );
    const imagesData = await imagesRes.json();

    if (!imagesRes.ok || imagesData.err) {
      return NextResponse.json({ error: imagesData.err || "Figma API error" }, { status: 500 });
    }

    const imageUrl = imagesData.images?.[parsed.nodeId];
    if (!imageUrl) {
      return NextResponse.json({ error: "Figma returned no image for that node. Check the node-id in your URL." }, { status: 500 });
    }

    // Fetch the PNG and convert to base64 data URL
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to download frame image from Figma" }, { status: 500 });
    }
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({ imageDataUrl: dataUrl });
  } catch (error) {
    console.error("figma-screenshot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
