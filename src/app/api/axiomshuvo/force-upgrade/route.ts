import { NextResponse } from "next/server";
import { mongoClient } from "@/lib/db/mongodb";
import { env } from "@/lib/env";

export async function GET() {
  try {
    const db = mongoClient.db();
    const email = env.MASTER_ADMIN_EMAIL;
    
    const result = await db.collection("user").updateOne(
      { email: email },
      { $set: { role: "ROLE_ADMIN" } }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: `User ${email} was forcefully upgraded to ROLE_ADMIN. You can now log out and log back in to get your admin session!`,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
