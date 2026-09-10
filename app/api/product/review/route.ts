import { NextRequest, NextResponse } from "next/server";
import { createReview } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, product_name, customer_name, rating, comment } = body;

    if (!product_id || !product_name) {
      return NextResponse.json({ error: "Product information missing." }, { status: 400 });
    }

    if (!customer_name || typeof customer_name !== "string" || !customer_name.trim()) {
      return NextResponse.json({ error: "আপনার নাম লিখুন।" }, { status: 400 });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "১ থেকে ৫ এর মধ্যে রেটিং দিন।" }, { status: 400 });
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ error: "আপনার রিভিউ মন্তব্য লিখুন।" }, { status: 400 });
    }

    const saved = createReview({
      product_id: String(product_id),
      product_name: String(product_name),
      customer_name: customer_name.trim(),
      rating: Math.round(numRating),
      comment: comment.trim(),
    });

    if (!saved) {
      return NextResponse.json({ error: "রিভিউ সংরক্ষণ করা সম্ভব হয়নি।" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully! It will be visible after approval.",
    });
  } catch (error: any) {
    console.error("[Review API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to submit review." }, { status: 500 });
  }
}
