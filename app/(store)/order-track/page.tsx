import { redirect } from "next/navigation";

interface OrderTrackPageProps {
  searchParams: Promise<{
    orderId?: string;
    id?: string;
    phone?: string;
    mobile?: string;
  }>;
}

export default async function OrderTrackRedirectPage({ searchParams }: OrderTrackPageProps) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.orderId || params.id) q.set("orderId", params.orderId || params.id || "");
  if (params.phone || params.mobile) q.set("phone", params.phone || params.mobile || "");

  const queryStr = q.toString();
  redirect(`/track${queryStr ? `?${queryStr}` : ""}`);
}
