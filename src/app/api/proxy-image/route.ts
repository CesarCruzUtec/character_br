import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Only proxy http/https URLs
  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return new NextResponse("Only http/https URLs are supported", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        // Pass a browser-like user agent to avoid blocks
        "User-Agent":
          "Mozilla/5.0 (compatible; TournamentSummaryBot/1.0)",
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch upstream image", { status: 502 });
  }
}
