import { redirect } from "next/navigation";

// Deprecated route: buying happens inline on /user/plans (plan card +
// stepper → order), so a separate checkout step is an orphaned duplicate.
// Keep the URL alive as a redirect instead of a 404.
export default function CheckoutPage() {
  redirect("/user/plans");
}
