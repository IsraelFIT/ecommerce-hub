"use client";

import {
  ShieldCheck,
  Lock,
  UserCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CoreSecurityPage() {
  const auditLogs = [
    {
      id: "LOG-3091",
      event: "Super Admin Session Verified",
      actor: "israelfolaranmi01@gmail.com",
      role: "super_admin",
      ip: "127.0.0.1",
      location: "Frankfurt, DE (via Neon Link)",
      time: "Just now",
      status: "Success",
    },
    {
      id: "LOG-3090",
      event: "Neon Branch Checked Out (staging)",
      actor: "System CLI (neon checkout)",
      role: "cli_agent",
      ip: "127.0.0.1",
      location: "Localhost",
      time: "25 mins ago",
      status: "Success",
    },
    {
      id: "LOG-3089",
      event: "Database Tables Initialized",
      actor: "FastAPI Engine (asyncpg)",
      role: "database_admin",
      ip: "127.0.0.1",
      location: "Localhost",
      time: "42 mins ago",
      status: "Success",
    },
    {
      id: "LOG-3088",
      event: "Tenant Store Provisioned (Jazz Cakes)",
      actor: "israelfolaranmi01@gmail.com",
      role: "super_admin",
      ip: "127.0.0.1",
      location: "Localhost",
      time: "1 hour ago",
      status: "Success",
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Security & Platform Audit Logs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time administrative session audits, JWT lifecycle controls, and
            RBAC governance
          </p>
        </div>

        <Button
          size="md"
          variant="outline"
          onClick={() => toast.success("Audit trail refreshed!")}
          className="gap-1.5 h-8 text-xs cursor-pointer self-start md:self-auto"
        >
          <Clock className="size-3.5" />
          <span>Refresh Logs</span>
        </Button>
      </div>

      {/* Security Policies Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Lock className="size-4" />
            <span>JWT Algorithm</span>
          </div>
          <p className="text-xl font-bold font-secondary text-foreground mt-2">
            HS256 (Signed)
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Access: 6 Hours • Refresh: 3 Days
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
            <ShieldCheck className="size-4" />
            <span>Master Admin Identity</span>
          </div>
          <p className="text-sm font-bold font-mono text-foreground mt-2 truncate">
            israelfolaranmi01@gmail.com
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
            Super Administrator Active
          </span>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-2 text-purple-500 font-bold text-sm">
            <UserCheck className="size-4" />
            <span>Multi-Tenant RBAC</span>
          </div>
          <p className="text-xl font-bold font-secondary text-foreground mt-2">
            Isolated Contexts
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Tenant Admins gated by tenant_id
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-card-gray/20 dark:bg-white/5">
          <h4 className="text-xs font-bold font-secondary text-foreground">
            Platform Security Trail
          </h4>
          <span className="text-[11px] text-muted-foreground font-mono">
            Immutable system logs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card-gray/30 dark:bg-white/5 text-[11px] text-muted-foreground">
                <th className="p-3.5 font-medium">Log ID</th>
                <th className="p-3.5 font-medium">Event Description</th>
                <th className="p-3.5 font-medium">Actor / Email</th>
                <th className="p-3.5 font-medium">Role</th>
                <th className="p-3.5 font-medium">Origin IP</th>
                <th className="p-3.5 font-medium">Timestamp</th>
                <th className="p-3.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                    {log.id}
                  </td>
                  <td className="p-3.5 font-semibold text-foreground">
                    {log.event}
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                    {log.actor}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-semibold">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                    {log.ip}
                  </td>
                  <td className="p-3.5 text-muted-foreground text-[11px]">
                    {log.time}
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="size-2.5" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
