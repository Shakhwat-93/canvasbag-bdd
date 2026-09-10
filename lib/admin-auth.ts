import { cookies } from "next/headers";

export async function isUserAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return Boolean(token && token.length > 10);
}
