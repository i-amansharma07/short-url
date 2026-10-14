import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/app/lib/pool";
import { generateShortCode } from "@/app/lib/short-code";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("originalUrl" in body) ||
    typeof body.originalUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "originalUrl is required" },
      { status: 400 },
    );
  }

  let originalUrl: URL;

  try {
    originalUrl = new URL(body.originalUrl.trim());

    if (
      !["http:", "https:"].includes(originalUrl.protocol) ||
      !originalUrl.hostname
    ) {
      throw new Error("Unsupported URL");
    }
  } catch {
    return NextResponse.json(
      { error: "Please provide a valid HTTP or HTTPS URL" },
      { status: 400 },
    );
  }

  const normalizedUrl = originalUrl.href;

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();

    try {
      const result = await pool.query(
        `INSERT INTO urls (original_url, short_code)
         VALUES ($1, $2)
         RETURNING id, original_url, short_code, created_at`,
        [normalizedUrl, shortCode],
      );

      const savedUrl = result.rows[0];

      return NextResponse.json(
        {
          id: savedUrl.id,
          originalUrl: savedUrl.original_url,
          shortCode: savedUrl.short_code,
          shortUrl: new URL(`/${savedUrl.short_code}`, request.url).toString(),
          createdAt: savedUrl.created_at,
        },
        { status: 201 },
      );
    } catch (error: unknown) {
      const isCollision =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505";

      if (isCollision) {
        continue;
      }

      console.error("Failed to create short URL:", error);

      return NextResponse.json(
        { error: "Unable to create short URL" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    { error: "Could not generate a unique shortcode. Please retry." },
    { status: 503 },
  );
}
