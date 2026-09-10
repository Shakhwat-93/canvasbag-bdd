import React from "react";
import { getAllSupportMessages } from "@/lib/db";
import { SupportManager } from "@/components/admin/support-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Inbox | CanvasBag Admin",
};

export default async function AdminSupportPage() {
  const supportMessages = getAllSupportMessages();

  return <SupportManager initialSupportMessages={supportMessages} />;
}
