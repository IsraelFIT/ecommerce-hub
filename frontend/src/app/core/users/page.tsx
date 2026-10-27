"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  Building2,
  MoreVertical,
  UserCheck,
  UserX,
  Crown,
  ShoppingBag,
  UserCircle2,
  UserCog2,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getCoreUsers,
  updateUserRole,
  updateUserStatus,
} from "@/lib/api/users";
import { CoreUserSummary, UserRole } from "@/types/users";
import { PaginationMeta } from "@/types";
import { formatCurrency } from "@/utils/helper";

export default function CoreUsersPage() {
  const [users, setUsers] = useState<CoreUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const pageSize = 15;

  // Action loading states
  const [, setUpdatingRoleId] = useState<string | null>(null);
  const [, setUpdatingStatusId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCoreUsers({
        search: searchTerm,
        role: roleFilter,
        page: currentPage,
        per_page: pageSize,
      });

      if (res.data?.items) {
        setUsers(res.data.items);
      }
      if (res.pagination) {
        setPagination(res.pagination as PaginationMeta);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchTerm, roleFilter, currentPage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingRoleId(userId);
      const res = await updateUserRole(userId, newRole);
      if (res.data) {
        toast.success(
          `User role updated to ${newRole.replace("_", " ").toUpperCase()}`,
        );
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      toast.error(msg);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      setUpdatingStatusId(userId);
      await updateUserStatus(userId, nextStatus);
      toast.success(
        nextStatus ? "User account activated" : "User account deactivated",
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: nextStatus } : u,
        ),
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update user status";
      toast.error(msg);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Metrics summary
  const totalCount = pagination?.total ?? users.length;
  const tenantAdminCount = users.filter(
    (u) => u.role === "tenant_admin",
  ).length;
  const hubAdminCount = users.filter((u) => u.role === "hub_admin").length;
  const customerCount = users.filter(
    (u) => u.role === "customer" || u.role === "user",
  ).length;

  const totalPages =
    pagination?.last_page || Math.ceil(totalCount / pageSize) || 1;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 font-semibold gap-1 text-xs">
            <Crown className="size-3.5" />
            <span>Super Admin</span>
          </Badge>
        );
      case "hub_admin":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/40 font-semibold gap-1 text-xs">
            <UserCog2 className="size-3.5" />
            <span>Hub Admin</span>
          </Badge>
        );
      case "tenant_admin":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 font-semibold gap-1 text-xs">
            <UserCircle2 className="size-3.5" />
            <span>Tenant Admin</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-border text-xs"
          >
            Customer
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-12">
      {/* Top Header & Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
              Users & Tenant Admins
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-muted/60 text-muted-foreground"
            >
              Core Management
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage store owners, promote tenant admins to hub admins, and
            inspect individual customer rosters.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={handleRefresh}
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

      {/* Stats Summary Strip (Products style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Registered Users</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-secondary text-foreground">
            {totalCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Platform-wide accounts
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tenant Store Admins</span>
            <Building2 className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-emerald-600 dark:text-emerald-400">
            {tenantAdminCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Storefront administrators
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Hub Administrators</span>
            <ShieldCheck className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-blue-600 dark:text-blue-400">
            {hubAdminCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Promoted platform moderators
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Store Customers</span>
            <ShoppingBag className="size-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-secondary text-purple-600 dark:text-purple-400">
            {customerCount}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Buyers & consumer profiles
          </p>
        </div>
      </div>

      {/* Filters Bar (Products style) */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-card p-3 rounded-xl border border-border text-foreground shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or store name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-9 text-xs bg-background border-border text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-9 text-xs w-40 bg-background border-border text-foreground">
              <SelectValue placeholder="Filter by Role" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
              <SelectItem value="hub_admin">Hub Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table (Products style) */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">
                User Profile
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Email/Phone
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Role
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Assigned Store
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Activity
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5 min-w-0">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-28 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground text-xs"
                >
                  <Users className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              users.map((userItem) => {
                const initials =
                  (userItem.first_name?.[0] || "") +
                    (userItem.last_name?.[0] || "") ||
                  userItem.email.slice(0, 2).toUpperCase();

                return (
                  <TableRow
                    key={userItem.id}
                    className="hover:bg-muted/30 transition-colors border-border"
                  >
                    {/* User Profile */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">
                            {userItem.full_name || userItem.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email/Phone */}
                    <TableCell className="py-3.5">
                      <div className="space-y-1.5 min-w-0">
                        <div className="text-foreground truncate">
                          {userItem.email}
                        </div>
                        {userItem.phone_number && (
                          <div className="text-xs text-muted-foreground">
                            {userItem.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-3.5">
                      {getRoleBadge(userItem.role)}
                    </TableCell>

                    {/* Assigned Store */}
                    <TableCell className="py-3.5">
                      {userItem.tenant_name ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground block">
                            {userItem.tenant_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {userItem.tenant_slug}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Platform Wide
                        </span>
                      )}
                    </TableCell>

                    {/* Activity */}
                    <TableCell className="py-3.5">
                      <div className="space-y-0.5">
                        <div className="text-muted-foreground">
                          {userItem.orders_count > 0 ? (
                            <span className="font-semibold text-foreground">
                              {userItem.orders_count} orders
                            </span>
                          ) : (
                            "0 orders"
                          )}
                        </div>
                        {userItem.total_spent > 0 && (
                          <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(userItem.total_spent, "NGN")}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={
                          userItem.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs"
                        }
                      >
                        {userItem.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Dropdown Menu for granular management */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 text-xs"
                          >
                            <DropdownMenuLabel>
                              Account Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* View Customer Details */}
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/core/users/${userItem.id}`}
                                className="cursor-pointer"
                              >
                                <Users className="size-3.5 mr-2" />
                                <span>View Details & Store</span>
                              </Link>
                            </DropdownMenuItem>

                            {/* Toggle Account Status */}
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleStatus(
                                  userItem.id,
                                  userItem.is_active,
                                )
                              }
                              className="cursor-pointer"
                            >
                              {userItem.is_active ? (
                                <>
                                  <UserX className="size-3.5 mr-2 text-rose-500" />
                                  <span className="text-rose-500">
                                    Deactivate Account
                                  </span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="size-3.5 mr-2 text-emerald-500" />
                                  <span className="text-emerald-500">
                                    Activate Account
                                  </span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>
                              Assign Platform Role
                            </DropdownMenuLabel>

                            <DropdownMenuItem
                              disabled={userItem.role === "hub_admin"}
                              onClick={() =>
                                handleRoleChange(userItem.id, "hub_admin")
                              }
                              className="cursor-pointer text-blue-600"
                            >
                              <ShieldCheck className="size-3.5 mr-2" />
                              <span>Set as Hub Admin</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={userItem.role === "tenant_admin"}
                              onClick={() =>
                                handleRoleChange(userItem.id, "tenant_admin")
                              }
                              className="cursor-pointer text-emerald-600"
                            >
                              <Building2 className="size-3.5 mr-2" />
                              <span>Set as Tenant Admin</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              disabled={userItem.role === "customer"}
                              onClick={() =>
                                handleRoleChange(userItem.id, "customer")
                              }
                              className="cursor-pointer"
                            >
                              <Users className="size-3.5 mr-2" />
                              <span>Set as Customer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <strong className="text-foreground">
              {(currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min(currentPage * pageSize, totalCount)}
            </strong>{" "}
            of <strong className="text-foreground">{totalCount}</strong> users
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
