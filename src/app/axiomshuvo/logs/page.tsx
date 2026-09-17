"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState, useRef } from "react";

const initialLogs = [
  { id: 1, time: "10:42:05", type: "INFO", message: "System initialized. Listening on port 3000." },
  { id: 2, time: "10:42:06", type: "INFO", message: "MongoDB connected successfully (Pool size: 10)." },
  { id: 3, time: "10:42:15", type: "INFO", message: "Synced upstream balance: DataImpulse (654.32 GB)." },
  { id: 4, time: "10:44:22", type: "WARN", message: "NetNut API latency high (450ms). Retrying connection..." },
  { id: 5, time: "10:44:23", type: "INFO", message: "NetNut API connection restored." },
  { id: 6, time: "10:51:10", type: "INFO", message: "User [PX-8F392K] successfully purchased 5GB Datacenter." },
  { id: 7, time: "10:51:12", type: "INFO", message: "DataImpulse Sub-user [px_usr_992] assigned 5GB." },
  { id: 8, time: "11:05:33", type: "ERROR", message: "Invalid promo code redemption attempt by user [PX-1M44P]." },
];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState(initialLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Simulate incoming live logs
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        type: Math.random() > 0.8 ? (Math.random() > 0.5 ? "WARN" : "ERROR") : "INFO",
        message: Math.random() > 0.5 
          ? `Heartbeat: Provider APIs responsive. DB ping: ${Math.floor(Math.random() * 20 + 5)}ms`
          : `Auth event: Session verified for incoming internal request.`
      };
      setLogs(prev => [...prev, newLog].slice(-50)); // keep last 50
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/logs" title="System Logs">
      
      {/* System Health Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard className="!bg-zinc-900/60 p-4 border-l-2 !border-l-emerald-500 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Server Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-lg font-bold text-white">Online (99.9%)</p>
          </div>
        </GlassCard>
        
        <GlassCard className="!bg-zinc-900/60 p-4 border-l-2 !border-l-cyan-500 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">DataImpulse API</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
            <p className="text-lg font-bold text-white">45ms Ping</p>
          </div>
        </GlassCard>
        
        <GlassCard className="!bg-zinc-900/60 p-4 border-l-2 !border-l-purple-500 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">NetNut API</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <p className="text-lg font-bold text-white">112ms Ping</p>
          </div>
        </GlassCard>

        <GlassCard className="!bg-zinc-900/60 p-4 border-l-2 !border-l-amber-500 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Database Ping</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <p className="text-lg font-bold text-white">12ms (Primary)</p>
          </div>
        </GlassCard>
      </div>

      {/* Terminal View */}
      <GlassCard className="!bg-[#0c0c0c] !border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/50">
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <p className="text-xs font-mono text-zinc-500">root@proxydata-prod: /var/log/syslog</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Live Feed</span>
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="p-6 h-[500px] overflow-y-auto font-mono text-[11px] sm:text-xs leading-relaxed space-y-2 scrollbar-thin scrollbar-thumb-white/10"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors group">
              <span className="text-zinc-500 shrink-0 select-none">[{log.time}]</span>
              <span className={`shrink-0 w-12 font-bold ${
                log.type === "INFO" ? "text-cyan-400" :
                log.type === "WARN" ? "text-amber-400" :
                "text-red-400"
              }`}>
                {log.type}
              </span>
              <span className="text-zinc-300 break-all">{log.message}</span>
            </div>
          ))}
        </div>
      </GlassCard>

    </AdminShell>
  );
}
