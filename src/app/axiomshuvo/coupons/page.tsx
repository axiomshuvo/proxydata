import { redirect } from "next/navigation";

// Coupons now live in the unified Codes area (redeem + coupon tabs).
export default function AdminCouponsRedirect() {
  redirect("/axiomshuvo/codes");
}
