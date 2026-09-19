import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient } from "@/lib/db/mongodb";
import { env } from "@/lib/env";
import { generatePublicId } from "./utils";
import { sendEmail } from "./email";


export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  // Production CSRF: the browser origin (proxydata.store) must be trusted,
  // otherwise the social callback is rejected and the UI hangs on "Connecting…".
  trustedOrigins: Array.from(
    new Set(
      [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL]
        .map((u) => {
          try {
            return new URL(u).origin;
          } catch {
            return null;
          }
        })
        .filter((o): o is string => !!o),
    ),
  ),
  database: mongodbAdapter(mongoClient.db()),
  advanced: {
    // Hostinger runs behind a reverse proxy: read the real client IP from
    // forwarded headers so rate limiting is per-IP, not one shared bucket.
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
    },
  },
  emailAndPassword: {
    enabled: true,
    // Explicit 1-hour token life (Better Auth default is also 3600s — pinned
    // here so an upstream default change can't silently extend the window).
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      // Policy: 1 reset email per address per 24h (exact, DB-backed so it
      // survives restarts and multi-process). This hook only runs for real
      // accounts (unknown emails get an identical success with no send),
      // so the throttle doubles as SMTP-quota protection.
      const db = mongoClient.db();
      const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
      const recent = await db.collection("password_reset_requests").countDocuments({
        email: user.email,
        requestedAt: { $gte: dayAgo },
      });
      if (recent >= 1) {
        console.warn(`Blocked password reset for ${user.email}: already requested within 24h`);
        return;
      }

      // Phase 11: Send SMTP email for password reset. The throttle row is
      // recorded ONLY on success — a failed send must stay retryable
      // instead of locking the user out for 24h (failures land in
      // runtime_logs via sendEmail for ops to see).
      const sent = await sendEmail({
        to: user.email,
        subject: "ProxyData - Reset Your Password",
        html: `
          <h3>Password Reset Request</h3>
          <p>Click the link below to reset your password. If you didn't request this, safely ignore this email.</p>
          <a href="${url}">Reset Password</a>
        `
      });
      if (sent.success) {
        await db.collection("password_reset_requests").insertOne({
          email: user.email,
          requestedAt: new Date(),
        });
      }
    }
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      publicUserId: {
        type: "string",
        required: false,
      },
      role: {
        type: "string",
        required: false,
      },
      status: {
        type: "string",
        required: false,
      },
      capabilities: {
        type: "string[]",
        required: false,
      }
    }
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Check if this is the Master Admin email bootstrapping
          const isMasterAdmin = user.email === env.MASTER_ADMIN_EMAIL;

          return {
            data: {
              ...user,
              publicUserId: generatePublicId(),
              role: isMasterAdmin ? "ROLE_ADMIN" : "ROLE_USER",
              status: "ACTIVE",
              capabilities: [],
            }
          }
        }
      }
    },
    session: {
      create: {
        // Fail-closed: DEACTIVATED accounts can never obtain a session (01 §7.2).
        // SUSPENDED users may still log in (read-only quarantine, enforced per-route).
        before: async (session) => {
          const status = (session.user as unknown as { status?: string })?.status;
          if (status === "DEACTIVATED") {
            throw new Error("Account deactivated.");
          }
          return { data: session };
        },
      },
    },
  },
});
