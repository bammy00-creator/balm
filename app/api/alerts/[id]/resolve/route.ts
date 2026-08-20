import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Session-scoped client, not the service role - the alerts_update RLS policy
// (clinic + branch scoped) is what actually authorizes this, matching the
// route named in SPEC section 10.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  const note = String(formData.get("note") ?? "").trim();

  if (note.length < 10) {
    return NextResponse.redirect(
      new URL(`/app/alerts?error=${encodeURIComponent("Note must be at least 10 characters.")}`, request.url),
      { status: 303 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("alerts")
    .update({ status: "resolved", note })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/app/alerts?error=${encodeURIComponent(error.message)}`, request.url),
      { status: 303 }
    );
  }

  return NextResponse.redirect(new URL("/app/alerts", request.url), { status: 303 });
}
