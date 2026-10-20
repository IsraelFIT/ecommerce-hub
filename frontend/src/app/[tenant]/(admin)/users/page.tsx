"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Search, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getTenantUsers, type TenantUserItem } from "@/lib/api/tenants";
import { useUserStore } from "@/store/user";
import { useTenantTheme } from "@/components/providers/tenant-theme-provider";
import { formatCurrency } from "@/utils/helper";
import { UserAvatar } from "@/components/shared/user-avatar";

export default function TenantUsersAdminPage() {
  const params = useParams();
  const routeTenantSlug = (params?.tenant as string) || "store";

  const { user } = useUserStore();
  const { tenant } = useTenantTheme();

  const activeTenantSlug =
    user?.tenant_slug ||
    (routeTenantSlug !== "store" ? routeTenantSlug : "jazz-cakes-ltd");

  const tenantCurrency = tenant?.currency || user?.tenant_currency || "NGN";

  const [users, setUsers] = useState<TenantUserItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await getTenantUsers(activeTenantSlug);
      if (res.status === "success" && res.data?.items) {
        setUsers(res.data.items);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load tenant users:", err);
      toast.error("Could not load users and customers.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "all") {
        if (roleFilter === "customer" && u.role !== "customer") return false;
        if (
          roleFilter === "admin" &&
          u.role !== "tenant_admin" &&
          u.role !== "admin" &&
          u.role !== "super_admin"
        )
          return false;
        if (roleFilter === "staff" && u.role !== "staff") return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !u.is_active) return false;
        if (statusFilter === "inactive" && u.is_active) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName =
          u.full_name?.toLowerCase().includes(query) ||
          u.first_name?.toLowerCase().includes(query) ||
          u.last_name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        const matchesPhone = u.phone_number?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesPhone;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, safeCurrentPage, pageSize]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "tenant_admin":
      case "admin":
      case "super_admin":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
            Admin
          </span>
        );
      case "staff":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            Staff
          </span>
        );
      case "customer":
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
            Customer
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 w-full">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold font-secondary text-foreground">
              Users & Registered Customers
            </h4>
            <Badge variant="outline" className="text-xs">
              {activeTenantSlug}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={isRefreshing || isLoading}
            className="gap-1.5 h-9 text-xs cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border text-foreground">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background border-border text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 text-xs w-35 bg-background border-border text-foreground">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-35 bg-background border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">
                User / Customer
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Role
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Contact Phone
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Orders
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Total Spent
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Joined
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`user-skel-${i}`} className="border-border">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-3 w-36 rounded-md" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-3.5 w-8 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex justify-end">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedUsers.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No accounts found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((item) => {
                const displayName =
                  item.full_name ||
                  `${item.first_name || ""} ${item.last_name || ""}`.trim() ||
                  "Customer";
                const initial =
                  item.first_name?.charAt(0)?.toUpperCase() ||
                  item.full_name?.charAt(0)?.toUpperCase() ||
                  item.email?.charAt(0)?.toUpperCase() ||
                  "U";

                return (
                  <TableRow
                    key={item.id}
                    className="border-border hover:bg-muted/40"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={item.avatar_url}
                          name={displayName}
                          email={item.email}
                          size="md"
                          shape="rounded"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-foreground block truncate">
                              {displayName}
                            </span>
                            {item.is_verified && (
                              <span title="Verified Account">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {item.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{renderRoleBadge(item.role)}</TableCell>

                    <TableCell className="text-xs text-foreground">
                      {item.phone_number || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs font-medium text-foreground">
                      {item.orders_count || 0}
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-foreground">
                      {formatCurrency(item.total_spent || 0, tenantCurrency)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-stone-200 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="cursor-pointer text-xs"
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <PaginationItem key={idx}>
                    <PaginationLink
                      isActive={safeCurrentPage === idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className="cursor-pointer text-xs"
                    >
                      {idx + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="cursor-pointer text-xs"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
