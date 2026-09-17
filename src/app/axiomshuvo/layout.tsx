import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/user/sign-in");
  }

  if (session.user.role !== "ROLE_ADMIN") {
    redirect("/user/dashboard");
  }

  if (session.user.status === "DEACTIVATED" || session.user.status === "SUSPENDED") {
    redirect("/user/sign-in?error=suspended");
  }

  return <>{children}</>;
}
