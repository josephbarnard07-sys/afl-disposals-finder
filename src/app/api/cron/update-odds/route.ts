import { NextRequest, NextResponse } from "next/server";
import { refreshOdds } from "@/lib/refreshOdds";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
 // if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
   // return new NextResponse("Unauthorized", { status: 401 });
  //}
  try {
    const result = await refreshOdds();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}