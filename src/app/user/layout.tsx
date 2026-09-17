import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Absolutely prevent Admins from accessing ANY /user/* routes
  // Automatically teleports them to their God-Mode dashboard
  if (session?.user?.role === "ROLE_ADMIN") {
    redirect("/axiomshuvo");
  }

  return <>{children}</>;
}
