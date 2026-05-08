import { NextResponse } from "next/server";
import { getIndex, EMBEDDING_DIM } from "@/lib/index";

export async function GET() {
  try {
    const index = getIndex();
    return NextResponse.json({ count: index.length, dim: EMBEDDING_DIM });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
