import { pool } from "@/app/lib/pool";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ shortCode: string }> },
) {
  console.log("reached");
  const { shortCode } = await context.params;

  try {
    const result = await pool.query(
      `SELECT original_url
       FROM urls
       WHERE short_code = $1
         AND is_active = TRUE
       LIMIT 1`,
      [shortCode],
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Short URL not found" },
        { status: 404 },
      );
    }

    return NextResponse.redirect(result.rows[0].original_url, 302);
  } catch (error) {
    console.error("Failed to resolve short URL:", error);

    return NextResponse.json(
      { error: "Unable to resolve short URL" },
      { status: 500 },
    );
  }
}
