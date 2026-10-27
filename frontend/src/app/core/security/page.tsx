"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserStore } from "@/store/user";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CoreSecurityPage() {
  const { user } = useUserStore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  const totalPages = Math.ceil(auditLogs.length / pageSize) || 1;
  const paginatedLogs = auditLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
          <p className="text-sm font-bold  text-foreground mt-2 truncate">
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
          <span className="text-[11px] text-muted-foreground ">
            Immutable system logs
          </span>
        </div>

        <Table>
          <TableHeader className="bg-card-gray/30 dark:bg-white/5 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Log ID
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Event Description
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Actor / Email
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Origin IP
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">
                Timestamp
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow
                key={log.id}
                className="hover:bg-muted/40 transition-colors border-border"
              >
                <TableCell className="p-3.5 text-[11px] text-muted-foreground">
                  {log.id}
                </TableCell>
                <TableCell className="p-3.5 font-semibold text-foreground text-xs">
                  {log.event}
                </TableCell>
                <TableCell className="p-3.5">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      src={
                        user?.email === log.actor ? user.avatar_url : undefined
                      }
                      email={log.actor}
                      name={
                        log.actor.includes("@")
                          ? log.actor.split("@")[0]
                          : log.actor
                      }
                      size="xs"
                      shape="rounded"
                    />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {log.actor}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                    {log.role}
                  </span>
                </TableCell>
                <TableCell className="p-3.5 text-[11px] text-muted-foreground">
                  {log.ip}
                </TableCell>
                <TableCell className="p-3.5 text-muted-foreground text-[11px]">
                  {log.time}
                </TableCell>
                <TableCell className="p-3.5 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="size-2.5" />
                    {log.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <strong className="text-foreground">
              {(currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min(currentPage * pageSize, auditLogs.length)}
            </strong>{" "}
            of <strong className="text-foreground">{auditLogs.length}</strong>{" "}
            logs
          </span>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === pageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(pageNum);
                      }}
                      className="cursor-pointer text-xs"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1);
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
