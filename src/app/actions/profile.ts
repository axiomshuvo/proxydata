"use server";

import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

/** Update own display name (email + publicUserId are immutable). */
export async function updateOwnName(name: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const clean = String(name ?? "").trim();
  if (clean.length < 2 || clean.length > 60) throw new Error("Name needs 2–60 characters.");
  const client = await clientPromise;
  await client.db().collection("user").updateOne(
    { publicUserId: session.user.publicUserId },
    { $set: { name: clean, updatedAt: new Date() } },
  );
  return { success: true, name: clean };
}
