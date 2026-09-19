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

/** Upload avatar to ImgBB and update profile URL (no Mongo buffer blobs) */
export async function updateOwnAvatar(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHORIZED");

  const { env } = await import("@/lib/env");
  if (!env.IMGBB_API_KEY) {
    throw new Error("ImgBB API key is not configured on the server.");
  }

  const file = formData.get("image") as File;
  if (!file) throw new Error("No image file provided.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be less than 5MB.");

  // Convert to base64 for ImgBB API
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const imgbbForm = new URLSearchParams();
  imgbbForm.append("key", env.IMGBB_API_KEY);
  imgbbForm.append("image", base64);
  imgbbForm.append("name", `avatar-${session.user.publicUserId}`);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: imgbbForm,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error?.message || "Failed to upload image to ImgBB.");
  }

  const imageUrl = data.data.display_url;

  const client = await clientPromise;
  await client.db().collection("user").updateOne(
    { publicUserId: session.user.publicUserId },
    { $set: { image: imageUrl, updatedAt: new Date() } }
  );

  return { success: true, imageUrl };
}
