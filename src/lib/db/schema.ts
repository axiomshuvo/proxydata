import { z } from "zod";

// -----------------------------------------------------------------------------
// 1. USERS COLLECTION
// -----------------------------------------------------------------------------
export const UserRole = z.enum(["ROLE_ADMIN", "ROLE_USER"]);
export const UserStatus = z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]);
export const UserCapability = z.enum(["CAPABILITY_AFFILIATE", "CAPABILITY_RESELLER"]);

export const UserSchema = z.object({
  _id: z.string().optional(), // MongoDB ObjectId stringified
  publicUserId: z.string().startsWith("PX-"), // CSPRNG + Crockford Base32
  email: z.string().email(),
  role: UserRole.default("ROLE_USER"),
  capabilities: z.array(UserCapability).default([]),
  status: UserStatus.default("ACTIVE"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 2. PROXY ACCOUNTS COLLECTION
// -----------------------------------------------------------------------------
// Provider ID is a plain string per 02 §7/§9 (e.g. "dataimpulse") —
// never an uppercase enum. Kept as a literal union for Zod safety.
export const ProviderId = z.enum(["dataimpulse"]);
export const ProviderType = ProviderId;
export const ProxyType = z.enum(["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"]);

export const ProxyAccountSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(), // Reference to User
  providerId: ProviderType,
  proxyType: ProxyType,
  providerSubUserId: z.number().int(), // Upstream sub-user ID
  poolTypeRaw: z.string(), // Raw pool identifier from provider
  password: z.string(), // AES-256-GCM encrypted blob
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 3. PROXY CONFIGURATIONS COLLECTION
// -----------------------------------------------------------------------------
export const ProtocolType = z.enum(["http", "socks5"]);
export const ModeType = z.enum(["rotating", "sticky"]);

export const ProxyConfigurationSchema = z.object({
  _id: z.string().optional(),
  proxyAccountId: z.string(), // 1:1 Reference to ProxyAccount
  protocol: ProtocolType.default("http"),
  mode: ModeType.default("rotating"),
  
  // Targeting (country-first rule; wire suffix built ONLY by adapter
  // buildTargetingSuffix() per 03 §6 — never hand-concat here)
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zip: z.string().optional(),
  asnInclude: z.string().optional(),
  excludeAsn: z.string().optional(),
  
  // Advanced
  rotationInterval: z.number().int().min(0).max(120).optional(),
  stickyRange: z.number().int().optional(),
  anonymousFilter: z.boolean().default(false),
  whitelistedIps: z.array(z.union([z.ipv4(), z.ipv6()])).default([]),
  consentForSupportView: z.boolean().default(false),
  
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 4. TRANSACTIONS COLLECTION
// -----------------------------------------------------------------------------
export const TransactionType = z.enum(["PURCHASE", "REDEEM", "ADMIN_ADJUSTMENT"]);
export const TransactionStatus = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ALLOCATING",
  "PROVIDER_VERIFIED",
  "ACTIVE",
  "CANCELLED",
  "EXPIRED",
  "FAILED"
]);

export const DiscountSource = z.enum(["OFFER", "COUPON", "NONE"]);

export const TransactionSchema = z.object({
  _id: z.string().optional(),
  transactionId: z.string(), // Unique, e.g. "TX-102938"
  userId: z.string(), // Reference to User
  type: TransactionType,
  status: TransactionStatus.default("PENDING"),
  proxyAccountId: z.string().optional(), // Reference to the persistent mapping
  providerId: ProviderType.optional(),
  proxyType: ProxyType.optional(),

  // Payload
  planId: z.string().optional(),
  planSnapshot: z.object({ planId: z.string(), name: z.string() }).optional(),
  bandwidthBytes: z.number().int(), // bandwidthGb × 1073741824

  // Pricing Snapshot (LOCKED — frozen at submission, re-validated at approval)
  providerCostBdt: z.number().optional(),
  trafficAddedGb: z.number(),
  balanceChargedGb: z.number().optional(),
  poolCoefficient: z.number().default(1),
  filterMultiplier: z.number().default(1),
  basePriceBdt: z.number(),
  offerDiscountBdt: z.number().default(0),
  couponDiscountBdt: z.number().default(0),
  finalDiscountAppliedBdt: z.number().default(0),
  discountSource: DiscountSource.default("NONE"),
  couponCode: z.string().optional(),
  finalAmountBdt: z.number(),
  
  // Payment Verification
  paymentReference: z.string().optional(), // sparse unique index
  senderNumber: z.string().optional(),
  
  // Timestamps
  createdAt: z.date(),
  approvedAt: z.date().optional(),
  activatedAt: z.date().optional(),
  expiredAt: z.date().optional(),
});

// -----------------------------------------------------------------------------
// 5. COUPONS COLLECTION
// -----------------------------------------------------------------------------
export const CouponType = z.enum(["FIXED_AMOUNT", "PERCENTAGE"]);

export const CouponStatus = z.enum(["ACTIVE", "INACTIVE"]);

export const CouponSchema = z.object({
  _id: z.string().optional(),
  code: z.string(), // Case-insensitive collation index in MongoDB
  status: CouponStatus.default("ACTIVE"),
  type: CouponType,
  value: z.number(), // Amount in BDT or Percentage (0-100)
  maxDiscountAmount: z.number().optional(),
  isOneTime: z.boolean().default(false), // claimed atomically at APPROVAL

  // Scoping Rules
  targetPlanId: z.string().optional(),
  targetUserId: z.string().optional(),

  // State ($inc-only usageCount, guarded by usageCount < usageLimit in-txn)
  usageCount: z.number().int().default(0),
  usageLimit: z.number().int().optional(),

  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

// -----------------------------------------------------------------------------
// 6. PLANS COLLECTION (dynamic catalog — never static tiers)
// -----------------------------------------------------------------------------
export const PlanStatus = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);
export const PlanExpiryAction = z.enum(["BLOCK", "BLOCK_AND_RECLAIM"]);
export const PlanPricingMode = z.enum(["FIXED", "TIERED"]);

// Volume tier: quantity range [minGb, maxGb] (maxGb null = open-ended) sold
// at pricePerGbBdt per GB. Ranges must start at 1, be contiguous with no
// gaps/overlaps, and rates must strictly decrease (bulk = cheaper).
export const PlanTierSchema = z.object({
  minGb: z.number().int().min(1),
  maxGb: z.number().int().min(1).nullable(),
  pricePerGbBdt: z.number().int().min(1),
});
export type PlanTier = z.infer<typeof PlanTierSchema>;

export const PlanSchema = z.object({
  _id: z.string().optional(),
  name: z.string(), // e.g. "5 GB Residential" or "Residential Flex"
  providerId: z.string(), // e.g. "dataimpulse"
  proxyType: ProxyType,
  pricingMode: PlanPricingMode.default("FIXED"),
  // FIXED: exact GB in the bundle. TIERED: ignored (checkout sends quantityGb).
  bandwidthGb: z.number().int().min(1),
  retailPriceBdt: z.number().int(), // FIXED bundle price (whole Taka)
  // TIERED only: volume rate table (validated contiguous + decreasing).
  tiers: z.array(PlanTierSchema).default([]),
  status: PlanStatus.default("ACTIVE"), // ARCHIVED hides from catalog, keeps history refs
  validityDays: z.number().int().optional(),
  expiryAction: PlanExpiryAction.default("BLOCK"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 7. OFFERS COLLECTION (plan-level promos, no code needed)
// -----------------------------------------------------------------------------
export const OfferStatus = z.enum(["ACTIVE", "INACTIVE"]);

export const OfferSchema = z.object({
  _id: z.string().optional(),
  planId: z.string(),
  status: OfferStatus.default("ACTIVE"),
  discountType: CouponType,
  discountValue: z.number(),
  promotionalPriceBdt: z.number(), // computed effective price
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
});

// -----------------------------------------------------------------------------
// 8. REDEEM CODES COLLECTION (never deleted — USED rows remain forever)
// -----------------------------------------------------------------------------
export const RedeemCodeStatus = z.enum([
  "GENERATED",
  "ACTIVE",
  "PROCESSING",
  "PROVIDER_ALLOCATED",
  "USED",
  "EXPIRED",
  "DISABLED",
]);

export const RedeemCodeSchema = z.object({
  _id: z.string().optional(),
  code: z.string(), // uppercase Crockford Base32, ≥12 chars from crypto.randomBytes
  bandwidthBytes: z.number().int(),
  providerId: ProviderType.optional(),
  proxyType: ProxyType.optional(),
  planRef: z.string().optional(),
  monetaryValuationBdt: z.number().optional(),
  status: RedeemCodeStatus.default("GENERATED"),
  validFrom: z.date().optional(), // absent = immediately ACTIVE
  validTo: z.date(), // default 30 days from generation
  createdAt: z.date(),
  redeemedBy: z.string().optional(), // UserId
  redeemedAt: z.date().optional(),
});

// -----------------------------------------------------------------------------
// 9. COUPON USAGES COLLECTION (append-only; unique guard lives in the index)
// -----------------------------------------------------------------------------
export const CouponUsageSchema = z.object({
  _id: z.string().optional(),
  couponId: z.string(),
  userId: z.string(),
  transactionId: z.string(),
  discountAppliedBdt: z.number(),
  createdAt: z.date(),
});

// -----------------------------------------------------------------------------
// 10. NOTIFICATIONS COLLECTION (90-day TTL; never secrets)
// -----------------------------------------------------------------------------
export const NotificationType = z.enum([
  "PURCHASE_RECEIVED",
  "PURCHASE_APPROVED",
  "PROXY_ACTIVATED",
  "PURCHASE_REJECTED",
  "PURCHASE_CANCELLED",
  "PURCHASE_EXPIRED",
  "REDEEM_SUCCESS",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_RESTORED",
  "AFFILIATE_REFERRAL",
  "AFFILIATE_PAYOUT",
  "SUPPORT_REPLY",
  "NEW_SUPPORT_TICKET",
  "NEW_ORDER_RECEIVED",
  "PAYOUT_REQUESTED",
  "LOW_INVENTORY_ALERT",
]);

export const NotificationSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  type: NotificationType, // Zod-enforced, no free strings
  title: z.string(),
  message: z.string(), // no proxy passwords / full TrxIDs
  read: z.boolean().default(false),
  createdAt: z.date(),
});

// -----------------------------------------------------------------------------
// 11. AFFILIATE COLLECTIONS (registration-only first-touch binding)
// -----------------------------------------------------------------------------
export const AffiliateProfileStatus = z.enum(["ACTIVE", "SUSPENDED"]);

const CommissionRuleShape = z.object({
  commissionAmountBdt: z.number(),
  commissionBandwidthGb: z.number(),
});

export const AffiliateProfileSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  status: AffiliateProfileStatus.default("ACTIVE"),
  globalCommissionOverride: CommissionRuleShape.partial().optional(),
  commissionRules: z
    .array(CommissionRuleShape.extend({ planId: z.string() }))
    .default([]),
  createdAt: z.date(),
});

export const AffiliateCodeStatus = z.enum(["ACTIVE", "DISABLED"]);

export const AffiliateCodeSchema = z.object({
  _id: z.string().optional(),
  code: z.string().max(8), // uppercase, ≤8 chars
  affiliateId: z.string(),
  status: AffiliateCodeStatus.default("ACTIVE"),
  createdAt: z.date(), // enforces the 3-new-codes/day throttle
});

export const AffiliateReferralSchema = z.object({
  _id: z.string().optional(),
  referredUserId: z.string(), // unique index
  affiliateId: z.string(),
  codeUsed: z.string(),
  createdAt: z.date(),
});

export const CommissionStatus = z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]);

export const AffiliateCommissionSchema = z.object({
  _id: z.string().optional(),
  affiliateId: z.string(),
  referredUserId: z.string(),
  transactionId: z.string(), // unique — one commission per transaction
  qualifyingBandwidthBytes: z.number().int(),
  // Rule snapshot (later plan/rule changes never rewrite history)
  commissionRuleAmountBdt: z.number(),
  commissionRuleBandwidthGb: z.number(),
  // Financial snapshot
  originalPlanPriceBdt: z.number(),
  providerCostBdt: z.number(),
  offerDiscountBdt: z.number().default(0),
  couponDiscountBdt: z.number().default(0),
  finalCustomerPriceBdt: z.number(),
  ownerMinimumProfitFloorBdt: z.number(),
  // Calculation outputs (final = MAX(0, MIN(normal, safe)))
  actualOwnerMarginBdt: z.number(),
  calculatedNormalCommissionBdt: z.number(),
  maximumSafeCommissionBdt: z.number(),
  finalCommissionBdt: z.number(),
  // Ledger state
  accountingPeriod: z.string(), // YYYY-MM Asia/Dhaka
  status: CommissionStatus.default("UNPAID"),
  paidAmountBdt: z.number().default(0),
  createdAt: z.date(),
});

export const AffiliatePayoutSchema = z.object({
  _id: z.string().optional(),
  affiliateId: z.string(),
  accountingPeriod: z.string(), // YYYY-MM, or "CUSTOM" + customRange
  customRange: z
    .object({ startUtc: z.date(), endUtc: z.date() })
    .optional(),
  amountBdt: z.number(),
  reference: z.string(), // required, e.g. bKash TrxID
  receiptUrl: z.string().optional(), // external image URL, never binary
  createdAt: z.date(),
});

// -----------------------------------------------------------------------------
// 12. PROVIDER COLLECTIONS (hourly cron; upsert, never full overwrite)
// -----------------------------------------------------------------------------
// Upstream pool strings are lowercase per 03 §3-§6 (incl. premium_residential).
// Internal 4-pool enum (ProxyType) stays UPPER_CASE per 02 §10.
export const ProviderPoolType = z.enum([
  "datacenter",
  "residential",
  "mobile",
  "premium_residential",
]);

export const ProviderMetadataSchema = z.object({
  _id: z.string().optional(),
  providerId: z.string(), // e.g. "dataimpulse"
  poolType: ProviderPoolType,
  countryCode: z.string(),
  countryName: z.string(),
  count: z.number().nullable(), // null for locations-only rows
  syncedAt: z.date(),
});

export const SyncType = z.enum(["LOCATIONS", "POOL_STATS"]);
export const SyncStatus = z.enum(["SUCCESS", "FAILED"]);

export const ProviderSyncLogSchema = z.object({
  _id: z.string().optional(),
  providerId: z.string(),
  syncType: SyncType,
  status: SyncStatus,
  completedAt: z.date(),
});

export const ProviderOperationType = z.enum([
  "ADD_BALANCE",
  "CREATE_USER",
  "DROP_BALANCE",
  "SET_BLOCKED",
  "DELETE_USER",
  "RESET_PASSWORD",
]);
export const ProviderOperationStatus = z.enum(["PENDING", "SUCCESS", "TIMEOUT", "FAILED"]);

export const ProviderOperationLogSchema = z.object({
  _id: z.string().optional(),
  transactionId: z.string(),
  operationType: ProviderOperationType,
  provider: z.literal("dataimpulse").default("dataimpulse"),
  // Exact payload sent — REDACTED (no passwords/tokens/TrxID-full) per 01 §24.1 rule 6.
  payload: z.record(z.string(), z.unknown()).optional(),
  redactedPayload: z.record(z.string(), z.unknown()).optional(),
  preCallBalanceBytes: z.number().int().optional(),
  response: z.record(z.string(), z.unknown()).optional(),
  status: ProviderOperationStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});

// -----------------------------------------------------------------------------
// 13. AUDIT LOGS (redacted — no passwords, tokens, or full TrxIDs)
// -----------------------------------------------------------------------------
export const AuditLogSchema = z.object({
  _id: z.string().optional(),
  actorId: z.string(),
  actorRole: z.string(),
  action: z.string(), // e.g. "SUSPEND_USER", "APPROVE_PURCHASE"
  targetType: z.string(), // e.g. "USER", "TRANSACTION"
  targetId: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  createdAt: z.date(),
});

// -----------------------------------------------------------------------------
// 14. SYSTEM SETTINGS (singleton; ADMIN_PATH never lives here)
// -----------------------------------------------------------------------------
export const SystemSettingsSchema = z.object({
  _id: z.literal("GLOBAL_SETTINGS"),
  pendingRequestExpiryDays: z.number().default(7),
  affiliateMaxActiveCodes: z.number().default(5),
  defaultCommissionPerGbBdt: z.number().default(10),
  minimumOwnerProfitBdt: z.number().default(15),
});

// -----------------------------------------------------------------------------
// 15. PROVIDERS REGISTRY (multi-provider foundation, 01 §6/§10)
// One row per upstream vendor. DataImpulse is pre-registered; future vendors
// sit as DISABLED ("Coming Soon") until wired. Secrets NEVER live here.
// -----------------------------------------------------------------------------
export const ProviderStatus = z.enum(["ACTIVE", "MAINTENANCE", "DISABLED"]);

export const ProviderDocSchema = z.object({
  _id: z.string().optional(),
  providerId: z.string(), // e.g. "dataimpulse" — the key everything references
  name: z.string(), // e.g. "DataImpulse"
  status: ProviderStatus.default("DISABLED"),
  // Pools this vendor sells (subset of the 4-pool ProxyType enum).
  pools: z.array(ProxyType).default([]),
  // Single wholesale buying cost ৳/GB; per-pool floors derive via coefficients.
  wholesaleBaseBdt: z.number().int().min(0).default(0),
  // Billing rule: GB multiplier per pool (DataImpulse ×1/×0.5/×2/×5).
  // A flat-rate vendor simply uses 1 for every pool it sells.
  coefficients: z.record(z.string(), z.number()).default({}),
  // Connection endpoints (adapter reads these; engine defaults match DataImpulse).
  gateway: z
    .object({
      host: z.string().default("gw.dataimpulse.com"),
      httpPort: z.number().int().default(823),
      socks5Port: z.number().int().default(824),
    })
    .default({ host: "gw.dataimpulse.com", httpPort: 823, socks5Port: 824 }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ProviderDoc = z.infer<typeof ProviderDocSchema>;

// -----------------------------------------------------------------------------
// EXPORT TYPES
// -----------------------------------------------------------------------------
export type User = z.infer<typeof UserSchema>;
export type ProxyAccount = z.infer<typeof ProxyAccountSchema>;
export type ProxyConfiguration = z.infer<typeof ProxyConfigurationSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type RedeemCode = z.infer<typeof RedeemCodeSchema>;
export type CouponUsage = z.infer<typeof CouponUsageSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type AffiliateProfile = z.infer<typeof AffiliateProfileSchema>;
export type AffiliateCode = z.infer<typeof AffiliateCodeSchema>;
export type AffiliateReferral = z.infer<typeof AffiliateReferralSchema>;
export type AffiliateCommission = z.infer<typeof AffiliateCommissionSchema>;
export type AffiliatePayout = z.infer<typeof AffiliatePayoutSchema>;
export type ProviderMetadata = z.infer<typeof ProviderMetadataSchema>;
export type ProviderSyncLog = z.infer<typeof ProviderSyncLogSchema>;
export type ProviderOperationLog = z.infer<typeof ProviderOperationLogSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
