import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

// A fuller, branded one-page waiting-room poster (SPEC Milestone 6), distinct
// from the plain QR PDF built in Milestone 3 (/api/links/[id]/qr.pdf) - that
// one is a bare code for printing anywhere; this is meant to be put up on a
// wall. Layout follows DESIGN.md section 15: milk background, one big
// headline, the QR code, one line beneath, the seal (plain circle, no
// scallop - DESIGN.md section 7 specifies exactly that simplified mark for
// secondary uses like this) small at the bottom, and deliberately no clinic
// logo/name header - "the clinic should feel it is their poster." Standard
// PDF fonts, not the web faces: the spec explicitly prioritizes this working
// printed in black only on a cheap office printer over typographic fidelity.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("feedback_links")
    .select("token, branches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const branch = link.branches as unknown as { name: string } | null;
  const url = new URL(`/r/${link.token}`, request.url).toString();

  const qrPng = await QRCode.toBuffer(url, { type: "png", width: 900, margin: 1 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 portrait, in points
  const { width, height } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const cocoa = rgb(0.2, 0.15, 0.12);
  const muted = rgb(0.48, 0.42, 0.36);
  const marigold = rgb(0.94, 0.65, 0.24);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.96, 0.93) }); // milk

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof bold,
    color = cocoa
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  let cursorY = 720;
  drawCentered("How was your visit today?", cursorY, 32, bold);
  cursorY -= 60;

  const qrSize = 360; // well over the 40mm (~113pt) minimum in DESIGN.md 15
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, { x: (width - qrSize) / 2, y: cursorY - qrSize, width: qrSize, height: qrSize });
  cursorY -= qrSize + 32;

  drawCentered(
    "It takes thirty seconds, and the clinic manager reads every response.",
    cursorY,
    14,
    regular,
    muted
  );

  // The seal mark, small, plain circle per DESIGN.md section 7.
  const sealY = 90;
  const sealR = 26;
  page.drawCircle({ x: width / 2, y: sealY, size: sealR, color: marigold });
  const sealText = "Balm";
  const sealTextWidth = bold.widthOfTextAtSize(sealText, 12);
  page.drawText(sealText, {
    x: width / 2 - sealTextWidth / 2,
    y: sealY - 4,
    size: 12,
    font: bold,
    color: cocoa,
  });

  if (branch?.name) {
    drawCentered(branch.name, 40, 10, regular, muted);
  }
  drawCentered(url.replace(/^https?:\/\//, ""), 25, 9, regular, muted);

  const bytes = await pdf.save();

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="feedback-poster-${link.token}.pdf"`,
    },
  });
}
