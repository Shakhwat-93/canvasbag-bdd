import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const session = await verifyAdminCredentials(email.trim(), password);

    if (!session || !session.access_token) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: "Logged in successfully." });

    response.cookies.set("admin_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    });

    response.cookies.set("admin_email", session.user.email || email.trim(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("[Admin Login Error]", error);
    return NextResponse.json({ error: error.message || "Authentication failed." }, { status: 500 });
  }
}
