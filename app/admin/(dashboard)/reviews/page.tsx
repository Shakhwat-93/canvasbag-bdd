import React from "react";
import { getAllReviews } from "@/lib/db";
import { ReviewsManager } from "@/components/admin/reviews-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews Moderation | CanvasBag Admin",
};

export default async function AdminReviewsPage() {
  const reviews = getAllReviews();

  return <ReviewsManager initialReviews={reviews} />;
}
