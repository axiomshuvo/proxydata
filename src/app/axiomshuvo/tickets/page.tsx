"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, Spinner, Chip } from "@heroui/react";
import { useState, useEffect } from "react";
import { getSupportTicketsAdmin, updateSupportTicketStatus, replySupportTicket } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const loadData = async () => {
    try {
      const data = await getSupportTicketsAdmin();
      setTickets(data);
    } catch (e) {
      console.error(e);
      notifyError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatus = async (id: string, newStatus: "OPEN" | "RESOLVED") => {
    setUpdating(id);
    try {
      await updateSupportTicketStatus(id, newStatus);
      notifySuccess(`Ticket marked as ${newStatus}`);
      await loadData();
    } catch (e) {
      notifyError("Failed to update status", "Try again");
    } finally {
      setUpdating(null);
    }
  };

  const handleReply = async (id: string) => {
    const text = replyText[id] || "";
    if (text.trim().length < 5) return notifyError("Too short", "Reply must be at least 5 chars.");
    
    setUpdating(id);
    try {
      const res = await replySupportTicket(id, text);
      notifySuccess("Reply sent!", res.deliveredToApp ? "In-app notification delivered." : "User has no account. Use email.");
      setReplyText(prev => ({ ...prev, [id]: "" }));
      await loadData();
    } catch (e) {
      notifyError("Failed to reply", e instanceof Error ? e.message : "Try again");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminShell basePath="/axiomshuvo" title="Support Tickets">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Support Tickets</h1>
        <p className="text-zinc-400 text-sm font-medium mb-8">Read and manage messages from the Contact page.</p>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner color="current" />
          </div>
        ) : tickets.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center border-dashed border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">Inbox Zero!</h3>
            <p className="text-zinc-500 text-sm max-w-md">There are no support tickets yet.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {tickets.map((t) => (
              <GlassCard key={t._id} className="p-6 flex flex-col md:flex-row gap-6 hover:border-white/10 transition-colors">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{t.name}</h3>
                    <Chip size="sm" color={t.status === "OPEN" ? "warning" : "success"} variant="soft" className="font-bold">
                      {t.status}
                    </Chip>
                  </div>
                  <div className="text-sm font-medium text-zinc-400">
                    <a href={`mailto:${t.email}`} className="text-cyan-400 hover:underline">{t.email}</a> &bull; {new Date(t.createdAt).toLocaleString()}
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {t.message}
                  </div>
                  
                  {t.adminReply && (
                    <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-sm">
                      <div className="font-bold text-cyan-400 mb-1 text-xs uppercase">Your Reply</div>
                      <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{t.adminReply}</div>
                      <div className="text-[10px] text-cyan-500/60 mt-2 font-mono">
                        Delivered {t.repliedAt ? new Date(t.repliedAt).toLocaleString() : ""}
                      </div>
                    </div>
                  )}

                  {t.status === "OPEN" && !t.adminReply && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        placeholder="Type a reply... (User will receive an in-app notification if they have an account)"
                        value={replyText[t._id] || ""}
                        onChange={(e) => setReplyText(prev => ({ ...prev, [t._id]: e.target.value }))}
                        className="w-full bg-black/50 border border-white/10 hover:border-white/20 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3 text-sm text-white placeholder-zinc-500 transition-colors resize-y min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm"
                          onPress={() => handleReply(t._id)}
                          isPending={updating === t._id}
                          className="bg-cyan-500 text-black font-bold"
                        >
                          Send In-App Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 min-w-[140px] justify-start md:border-l md:border-white/5 md:pl-6 pt-4 md:pt-0">
                  {t.status === "OPEN" ? (
                    <Button 
                      onPress={() => handleStatus(t._id, "RESOLVED")}
                      isPending={updating === t._id}
                      className="bg-emerald-500/10 text-emerald-400 font-bold w-full"
                    >
                      Mark Resolved
                    </Button>
                  ) : (
                    <Button 
                      onPress={() => handleStatus(t._id, "OPEN")}
                      isPending={updating === t._id}
                      className="bg-amber-500/10 text-amber-400 font-bold w-full"
                    >
                      Re-Open
                    </Button>
                  )}
                  <Button
                    onPress={() => window.location.href = `mailto:${t.email}`}
                    className="bg-white/5 text-white font-bold w-full"
                  >
                    Reply via Email
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
