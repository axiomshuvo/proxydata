import { NextResponse } from "next/server";
import { mongoClient } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const db = mongoClient.db();
    
    const existing = await db.collection("plans").countDocuments();
    if (existing === 0) {
      await db.collection("plans").insertMany([
        {
          name: "Starter 1 GB",
          providerId: "dataimpulse",
          proxyType: "RESIDENTIAL",
          bandwidthGb: 1,
          retailPriceBdt: 120,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Professional 5 GB",
          providerId: "dataimpulse",
          proxyType: "RESIDENTIAL",
          bandwidthGb: 5,
          retailPriceBdt: 500,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Enterprise 50 GB",
          providerId: "dataimpulse",
          proxyType: "RESIDENTIAL",
          bandwidthGb: 50,
          retailPriceBdt: 4500,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      return NextResponse.json({ success: true, message: "Plans seeded successfully!" });
    }
    return NextResponse.json({ success: true, message: "Plans already exist." });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
