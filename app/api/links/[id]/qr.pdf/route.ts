import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: link } = await supabase
    .from("feedback_links")
    .select("token, label, clinics(name), branches(name)")
    .eq("id", id)
    .maybeSingle();

  if (!link) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const clinic = link.clinics as unknown as { name: string } | null;
  const branch = link.branches as unknown as { name: string } | null;
  const url = new URL(`/r/${link.token}`, request.url).toString();

  const png = await QRCode.toBuffer(url, { type: "png", width: 900, margin: 1 });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 595]); // A5 portrait, in points
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const image = await pdf.embedPng(png);

  const { width } = page.getSize();
  const qrSize = 260;

  page.drawText(clinic?.name ?? "", {
    x: 40,
    y: 520,
    size: 18,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText("How was your visit?", {
    x: 40,
    y: 495,
    size: 14,
    font: regular,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawImage(image, {
    x: (width - qrSize) / 2,
    y: 190,
    width: qrSize,
    height: qrSize,
  });
  page.drawText("Scan to share feedback - it takes about 30 seconds.", {
    x: 40,
    y: 150,
    size: 12,
    font: regular,
    color: rgb(0.3, 0.3, 0.3),
  });
  if (branch?.name) {
    page.drawText(branch.name, { x: 40, y: 125, size: 11, font: regular, color: rgb(0.5, 0.5, 0.5) });
  }
  page.drawText(url, { x: 40, y: 40, size: 9, font: regular, color: rgb(0.6, 0.6, 0.6) });

  const bytes = await pdf.save();

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="feedback-qr-${link.token}.pdf"`,
    },
  });
}
