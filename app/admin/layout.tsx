import React from "react";

export const metadata = {
  title: "Admin Portal | CanvasBag Management",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 text-slate-800 font-poppins min-h-screen flex flex-col">
      {children}
    </div>
  );
}
