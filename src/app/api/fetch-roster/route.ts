import { NextRequest, NextResponse } from "next/server";
import { RosterSchema } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing Pastebin ID parameter" },
      { status: 400 }
    );
  }

  // Sanitize the ID to prevent SSRF
  const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, "");
  if (sanitizedId.length === 0) {
    return NextResponse.json(
      { error: "Invalid Pastebin ID" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://pastebin.com/raw/${sanitizedId}`,
      {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from Pastebin: ${response.status}` },
        { status: 502 }
      );
    }

    const text = await response.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Pastebin content is not valid JSON" },
        { status: 422 }
      );
    }

    // Validate with Zod
    const result = RosterSchema.safeParse(data);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "JSON validation failed",
          details: result.error.issues.map(
            (i) => `${i.path.join(".")}: ${i.message}`
          ),
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to fetch roster: ${message}` },
      { status: 500 }
    );
  }
}
