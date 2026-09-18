"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { createAffiliateCode, disableAffiliateCode, getMyAffiliate } from "@/app/actions/affiliate";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AffiliatePage() {
  const { data: session } = authClient.useSession();
  const capabilities = ((session?.user as any)?.capabilities ?? []) as string[];
  const isAffiliate = capabilities.includes("CAPABILITY_AFFILIATE");

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setData(await getMyAffiliate());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAffiliate) refresh();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAffiliate]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await createAffiliateCode(newCode);
      setNewCode("");
      notifySuccess("Code created", res.code);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Create failed.";
      setError(message);
      notifyError("Create failed", message);
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async (code: string) => {
    setBusy(true);
    try {
      await disableAffiliateCode(code);
      notifySuccess("Code disabled", `${code} will never work again.`);
      await refresh();
    } catch (e) {
      notifyError("Disable failed", e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  };

  // Invite-only: no public promotion, no self-enrollment. Admin grants
  // CAPABILITY_AFFILIATE to accepted users; everyone else sees this notice.
  if (!isAffiliate) {
    return (
      <CustomerShell activePath="/user/affiliate">
        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-10 rounded-3xl text-center max-w-lg mx-auto mt-10">
          <h1 className="text-xl font-bold text-white">Invite only</h1>
          <p className="text-sm text-zinc-400 mt-2">
            The partner program is available to invited users. If you were invited, contact support to activate your account.
          </p>
        </GlassCard>
      </CustomerShell>
    );
  }

  const activeCodes = data?.codes?.filter((c: any) => c.status === "ACTIVE") ?? [];
  const deadCodes = data?.codes?.filter((c: any) => c.status !== "ACTIVE") ?? [];

  return (
    <CustomerShell activePath="/user/affiliate">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Partner Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Your referrals and commissions.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard className="!bg-zinc-900/60 p-6">
              <p className="text-zinc-400 text-sm font-medium">Total Earned</p>
              <p className="text-3xl font-bold text-white mt-2">৳{(data?.earned ?? 0).toLocaleString()}</p>
            </GlassCard>
            <GlassCard className="!bg-zinc-900/60 p-6">
              <p className="text-zinc-400 text-sm font-medium">Unpaid Balance</p>
              <p className="text-3xl font-bold text-white mt-2">৳{(data?.unpaid ?? 0).toLocaleString()}</p>
            </GlassCard>
            <GlassCard className="!bg-zinc-900/60 p-6">
              <p className="text-zinc-400 text-sm font-medium">Qualifying Purchases</p>
              <p className="text-3xl font-bold text-white mt-2">{data?.commissions?.length ?? 0}</p>
            </GlassCard>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <GlassCard className="!bg-zinc-900/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Your Referral Codes</h2>
              {activeCodes.length === 0 && deadCodes.length === 0 && (
                <p className="text-sm text-zinc-500 mb-4">No codes yet — create your first below.</p>
              )}
              <div className="space-y-2 mb-4">
                {activeCodes.map((c: any) => (
                  <div key={c.code} className="flex items-center gap-2">
                    <div className="flex-1"><CopyBox text={c.code} /></div>
                    <button
                      onClick={() => handleDisable(c.code)}
                      disabled={busy}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 text-xs font-bold rounded-lg disabled:opacity-40"
                    >
                      Disable
                    </button>
                  </div>
                ))}
                {deadCodes.map((c: any) => (
                  <div key={c.code} className="font-mono text-xs text-zinc-600 line-through px-1">
                    {c.code} (disabled — never reusable)
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-white/10 pt-4">
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="NEWCODE"
                  maxLength={8}
                  className="custom-input flex-1 font-mono"
                />
                <Button onClick={handleCreate} isDisabled={busy || newCode.trim().length < 3} className="bg-cyan-600 text-white font-bold px-6">
                  {busy ? "…" : "Create"}
                </Button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">3–8 letters/digits · max 3 new per day · disabled codes stay in history.</p>
            </GlassCard>

            <GlassCard className="!bg-zinc-900/60 p-6">
              <h2 className="text-lg font-bold text-white mb-4">How it works</h2>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li>· Share a code — newcomers enter it at sign-up.</li>
                <li>· You earn a commission on each of their activated purchases.</li>
                <li>· Payouts are settled by the admin and appear below.</li>
              </ul>
              {(data?.payouts?.length ?? 0) > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                  {data.payouts.map((p: any) => (
                    <div key={p._id} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{p.accountingPeriod} · {p.reference}</span>
                      <span className="font-bold text-emerald-400">৳{Number(p.amountBdt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto">
            <h2 className="text-lg font-bold text-white mb-4">Commission History</h2>
            {(data?.commissions?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">No qualifying purchases yet.</p>
            ) : (
              <table className="w-full text-left text-sm text-zinc-300 min-w-[480px]">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Period</th>
                    <th className="pb-3 font-semibold">Referred user</th>
                    <th className="pb-3 font-semibold text-right">Earned</th>
                    <th className="pb-3 font-semibold text-right">State</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commissions.map((c: any) => (
                    <tr key={c._id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-xs text-zinc-400">{c.accountingPeriod}</td>
                      <td className="py-3 font-mono text-xs text-zinc-300">{String(c.referredUserId).slice(-8)}</td>
                      <td className="py-3 text-right text-xs font-bold text-emerald-400">৳{Number(c.finalCommissionBdt ?? 0).toLocaleString()}</td>
                      <td className="py-3 text-right text-xs text-zinc-400">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GlassCard>
        </>
      )}
    </CustomerShell>
  );
}
