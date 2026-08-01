import { NextResponse } from "next/server";
import { refreshOdds } from "@/lib/refreshOdds";

export async function POST() {
  try {
    const result = await refreshOdds();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}