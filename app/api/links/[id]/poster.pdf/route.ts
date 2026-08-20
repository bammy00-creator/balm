import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

// A fuller, branded one-page waiting-room poster (SPEC Milestone 6), distinct
// from the plain QR PDF built in Milestone 3 (/api/links/[id]/qr.pdf) - that
// one is a bare code for printing anywhere; this is meant to be put up on a
// wall.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("feedback_links")
    .select("token, clinics(name, logo_url), branches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const clinic = link.clinics as unknown as { name: string; logo_url: string | null } | null;
  const branch = link.branches as unknown as { name: string } | null;
  const url = new URL(`/r/${link.token}`, request.url).toString();

  const qrPng = await QRCode.toBuffer(url, { type: "png", width: 900, margin: 1 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4 portrait, in points
  const { width } = page.getSize();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.11, 0.11, 0.13);
  const muted = rgb(0.44, 0.44, 0.47);

  let cursorY = 760;

  if (clinic?.logo_url) {
    try {
      const res = await fetch(clinic.logo_url);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") ?? "";
      const image = contentType.includes("png")
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
      const logoSize = 72;
      page.drawImage(image, {
        x: (width - logoSize) / 2,
        y: cursorY - logoSize,
        width: logoSize,
        height: logoSize,
      });
      cursorY -= logoSize + 20;
    } catch {
      // No logo, or an unreadable format - skip it rather than failing the
      // whole poster.
    }
  }

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof bold,
    color = ink
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
  };

  drawCentered(clinic?.name ?? "", cursorY, 22, bold);
  cursorY -= 40;
  drawCentered("How was your visit today?", cursorY, 26, bold);
  cursorY -= 30;
  drawCentered("Tell us in about 30 seconds - it helps us do better.", cursorY, 13, regular, muted);
  cursorY -= 40;

  const qrSize = 320;
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, { x: (width - qrSize) / 2, y: cursorY - qrSize, width: qrSize, height: qrSize });
  cursorY -= qrSize + 30;

  drawCentered("Scan this code with your phone camera", cursorY, 14, bold);
  cursorY -= 22;
  drawCentered("No app or login needed.", cursorY, 12, regular, muted);

  if (branch?.name) {
    drawCentered(branch.name, 70, 11, regular, muted);
  }
  drawCentered(url.replace(/^https?:\/\//, ""), 50, 10, regular, muted);

  const bytes = await pdf.save();

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="feedback-poster-${link.token}.pdf"`,
    },
  });
}
