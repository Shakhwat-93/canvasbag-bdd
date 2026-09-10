import { NextRequest, NextResponse } from "next/server";
import { createSupportMessage } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, message } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "আপনার নাম লিখুন।" }, { status: 400 });
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json({ error: "মোবাইল নাম্বার দিন।" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "আপনার বার্তা লিখুন।" }, { status: 400 });
    }

    const saved = createSupportMessage({
      name: name.trim(),
      phone: phone.trim(),
      message: message.trim(),
    });

    if (!saved) {
      return NextResponse.json({ error: "মেসেজ সেভ করা সম্ভব হয়নি।" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error: any) {
    console.error("[Support API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to process message." }, { status: 500 });
  }
}
