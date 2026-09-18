import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoClient } from "@/lib/db/mongodb";
import { env } from "@/lib/env";
import { generatePublicId } from "./utils";
import { sendEmail } from "./email";


export const auth = betterAuth({
  database: mongodbAdapter(mongoClient.db()),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      // Phase 11: Send SMTP email for password reset
      await sendEmail({
        to: user.email,
        subject: "ProxyData - Reset Your Password",
        html: `
          <h3>Password Reset Request</h3>
          <p>Click the link below to reset your password. If you didn't request this, safely ignore this email.</p>
          <a href="${url}">Reset Password</a>
        `
      });
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
