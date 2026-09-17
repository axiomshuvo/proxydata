"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { Envelope, Persons, Tags, Wallet } from "@gravity-ui/icons";
import { useState } from "react";

export default function AdminAffiliatesPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [commission, setCommission] = useState("15");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setInviteSent(true);
      setInviteEmail("");
      setMessage("");
      setTimeout(() => setInviteSent(false), 3000);
    }, 1500);
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/affiliates" title="Affiliate Management">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Track network growth, monitor referred users, and invite VIP partners.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Column: Metrics & Network */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard className="!bg-zinc-900/60 p-5 rounded-2xl border-white/5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Persons width={14} className="text-blue-400" />
                Total Affiliates
              </p>
              <p className="text-3xl font-bold text-white mt-2 font-mono">14</p>
            </GlassCard>

            <GlassCard className="!bg-zinc-900/60 p-5 rounded-2xl border-white/5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Wallet width={14} className="text-emerald-400" />
                Total Commissions
              </p>
              <p className="text-3xl font-bold text-white mt-2 font-mono">৳4,500</p>
            </GlassCard>

            <GlassCard className="!bg-zinc-900/60 p-5 rounded-2xl border-white/5 relative overflow-hidden border-b-2 !border-b-amber-500">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                <Tags width={14} className="text-amber-400" />
                Pending Payouts
              </p>
              <p className="text-3xl font-bold text-amber-400 mt-2 font-mono">৳1,200</p>
            </GlassCard>
          </div>

          {/* Affiliate Table */}
          <GlassCard className="!bg-zinc-900/60 p-6 rounded-2xl border-white/5 overflow-x-auto shadow-xl">
            <h2 className="text-xs font-bold text-white mb-4 uppercase tracking-widest">Active Partner Network</h2>
            <table className="w-full text-left text-sm text-zinc-300 min-w-[650px]">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Affiliate</th>
                  <th className="pb-3 font-semibold">Invite Code</th>
                  <th className="pb-3 font-semibold text-center">Rate</th>
                  <th className="pb-3 font-semibold text-center">Referrals</th>
                  <th className="pb-3 font-semibold text-right">Total Earned</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30 flex items-center justify-center text-xs">YT</div>
                      <div>
                        <p className="font-bold text-white">influencer@youtube.com</p>
                        <p className="text-[10px] text-amber-400 font-bold">VIP PARTNER</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-bold text-cyan-400 text-xs">YOUTUBE24</td>
                  <td className="py-4 text-center"><span className="px-2 py-1 bg-white/5 rounded text-white text-xs font-bold border border-white/10">20%</span></td>
                  <td className="py-4 text-center font-bold text-white">45</td>
                  <td className="py-4 text-right text-emerald-400 font-bold">৳3,500</td>
                  <td className="py-4 text-right">
                    <button className="px-3 py-1.5 bg-white/5 text-white font-bold text-[10px] uppercase rounded hover:bg-white/10 border border-white/10 transition-colors">View Tree</button>
                  </td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 flex items-center justify-center text-xs">U9</div>
                      <div>
                        <p className="font-bold text-zinc-300">user99@gmail.com</p>
                        <p className="text-[10px] text-zinc-500 font-bold">STANDARD</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-bold text-zinc-400 text-xs">PX-99A1B2</td>
                  <td className="py-4 text-center"><span className="px-2 py-1 bg-white/5 rounded text-zinc-400 text-xs font-bold border border-white/5">10%</span></td>
                  <td className="py-4 text-center font-bold text-zinc-300">2</td>
                  <td className="py-4 text-right text-emerald-400 font-bold opacity-80">৳150</td>
                  <td className="py-4 text-right">
                    <button className="px-3 py-1.5 bg-white/5 text-white font-bold text-[10px] uppercase rounded hover:bg-white/10 border border-white/10 transition-colors">View Tree</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </GlassCard>
        </div>

        {/* Right Column: VIP Mail Invitation Form */}
        <div className="lg:col-span-4">
          <GlassCard className={`!bg-zinc-900/60 p-6 rounded-2xl border transition-all duration-300 ${inviteSent ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)]'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${inviteSent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'}`}>
                <Envelope width={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Send VIP Invitation</h3>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Mail Affiliate Offer</p>
              </div>
            </div>

            {inviteSent ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 className="font-bold text-emerald-400 mb-1">Invitation Sent!</h4>
                <p className="text-xs text-emerald-400/80">The VIP offer has been emailed to the prospect.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Prospect Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors" 
                    placeholder="influencer@example.com" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Custom Commission Rate</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 text-white font-bold rounded-lg pl-4 pr-8 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors" 
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-500 font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-cyan-500/70 mt-1.5">Standard users receive 10% by default.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Personalized Message (Optional)</label>
                  <textarea 
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-lg px-4 py-3 text-xs focus:border-cyan-500 focus:outline-none transition-colors resize-none" 
                    placeholder="Hi! We love your content and want to offer you an exclusive partner rate..."
                  ></textarea>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    isDisabled={isSending || !inviteEmail}
                    className={`w-full py-3 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${isSending ? "bg-cyan-600/50 text-white/50 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"}`}
                  >
                    {isSending ? (
                      "Sending Mail..."
                    ) : (
                      <>
                        <Envelope width={16} />
                        Dispatch VIP Offer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>

      </div>
    </AdminShell>
  );
}
