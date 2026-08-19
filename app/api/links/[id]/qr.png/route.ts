import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Uses the session-scoped client, not the service role - RLS alone decides
  // whether this link belongs to the caller's clinic (SPEC section 6/13.4).
  const supabase = await createClient();
  const { data: link } = await supabase
    .from("feedback_links")
    .select("token")
    .eq("id", id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(`/r/${link.token}`, request.url).toString();
  const png = await QRCode.toBuffer(url, { type: "png", width: 600, margin: 2 });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="feedback-qr-${link.token}.png"`,
    },
  });
}
