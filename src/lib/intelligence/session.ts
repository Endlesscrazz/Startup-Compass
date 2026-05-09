import { auth } from "@/auth";

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id && typeof id === "string" ? id : null;
}
