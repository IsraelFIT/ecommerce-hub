"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  Building2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Download,
  Percent,
  Search,
} from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";
import { PaymentGatewayLogo } from "@/components/shared/payment-gateway-logo";
import {
  getCoreRevenueAnalytics,
  settleAllEscrowBalances,
} from "@/lib/api/payments";
import { CoreRevenueMetric, CoreSplitTransaction } from "@/types/users";

export default function CoreRevenuePage() {
  const [metrics, setMetrics] = useState<CoreRevenueMetric[]>([]);
  const [transactions, setTransactions] = useState<CoreSplitTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState("NGN");

  // Filtering & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadRevenueData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getCoreRevenueAnalytics();
      if (res.data) {
        setMetrics(res.data.metrics || []);
        setTransactions(res.data.transactions || []);
        if (res.data.primary_currency) {
          setPrimaryCurrency(res.data.primary_currency);
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load revenue data";
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRevenueData();
  }, [loadRevenueData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRevenueData();
  };

  const handleSettle = async () => {
    try {
      setIsSettling(true);
      const res = await settleAllEscrowBalances();
      toast.success(
        res.message ||
          "All escrow balances settled and payouts initiated via Stripe & Paystack!",
      );
      await loadRevenueData();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to trigger settlement";
      toast.error(msg);
    } finally {
      setIsSettling(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transaction records to export");
      return;
    }

    const headers = [
      "Split ID",
      "Order Reference",
      "Tenant Store",
      "Customer Name",
      "Customer Email",
      "Gross Amount",
      "Platform Fee (2.5%)",
      "Tenant Payout (97.5%)",
      "Currency",
      "Gateway Routing",
      "Status",
      "Date",
    ];

    const rows = transactions.map((tx) => [
      tx.id,
      tx.orderId,
      `"${tx.tenant.replace(/"/g, '""')}"`,
      `"${tx.customer.replace(/"/g, '""')}"`,
      tx.customerEmail || "",
      tx.gross.toFixed(2),
      tx.platformFee.toFixed(2),
      tx.tenantPayout.toFixed(2),
      tx.currency,
      `"${tx.gateway.replace(/"/g, '""')}"`,
      tx.status,
      `"${tx.date}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ecommerce-hub-split-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Revenue split audit log exported to CSV");
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case "gmv":
        return DollarSign;
      case "fees":
        return Percent;
      case "escrow":
        return Building2;
      default:
        return ShieldCheck;
    }
  };

  // Filtered transactions based on search query
  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return transactions;
    return transactions.filter(
      (tx) =>
        tx.id.toLowerCase().includes(term) ||
        tx.orderId.toLowerCase().includes(term) ||
        tx.tenant.toLowerCase().includes(term) ||
        tx.customer.toLowerCase().includes(term) ||
        (tx.customerEmail && tx.customerEmail.toLowerCase().includes(term)) ||
        tx.gateway.toLowerCase().includes(term),
    );
  }, [transactions, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-6 w-full pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
              Platform Revenue & Escrow Split Routing
            </h2>
            <Badge
              variant="outline"
              className="text-xs bg-muted/60 text-muted-foreground"
            >
              Live Core Ledger
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated 2.5% platform fee deduction and 97.5% subaccount escrow
            distribution across all tenant stores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="md"
            variant="outline"
            className="gap-1.5 h-9 text-xs cursor-pointer"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            size="md"
            variant="outline"
            className="gap-1.5 h-9 text-xs cursor-pointer"
            onClick={handleExportCSV}
            disabled={isLoading || transactions.length === 0}
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="md"
            disabled={isSettling || isLoading}
            onClick={handleSettle}
            className="gap-1.5 h-9 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <RefreshCw
              className={`size-3.5 ${isSettling ? "animate-spin" : ""}`}
            />
            <span>{isSettling ? "Settling..." : "Trigger Escrow Payouts"}</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`kpi-skel-${i}`}
                className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="size-8 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-7 w-36" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
            ))
          : metrics.map((stat) => {
              const Icon = getMetricIcon(stat.id);
              return (
                <div
                  key={stat.id}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </span>
                    <div
                      className={`size-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl font-bold font-secondary text-foreground tracking-tight">
                      {stat.value}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {stat.change}
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        {stat.subtitle}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Split Mechanism Breakdown Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            %
          </div>
          <div>
            <h4 className="text-sm font-bold font-secondary text-foreground">
              Dynamic Take-Rate Protocol (2.5% Platform Cut)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every checkout dynamically computes the 2.5% platform fee and
              routes 97.5% directly to the tenant&apos;s Paystack subaccount or
              Stripe Connected account.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 text-xs shrink-0 font-semibold"
        >
          SPLIT_CONFIG_ACTIVE
        </Badge>
      </div>

      {/* Transactions Table with UI Table & Pagination */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40">
          <div>
            <h4 className="text-xs font-bold font-secondary text-foreground">
              Escrow Split Audit Log ({filteredTransactions.length})
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Real-time settlement records directly from the database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search splits..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2.5 py-1.5 rounded-md border border-border shrink-0">
              Currency: {primaryCurrency}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-border">
                <TableHead className="py-3 px-3.5 font-bold text-foreground">
                  Split ID / Date
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-foreground">
                  Tenant Store
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-foreground">
                  Gross Amount
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-primary">
                  Platform Fee (2.5%)
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                  Tenant Payout (97.5%)
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-foreground">
                  Subaccount Routing
                </TableHead>
                <TableHead className="py-3 px-3.5 font-bold text-foreground text-right">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`tx-skel-${i}`}>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="p-3.5">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="p-3.5 text-right">
                      <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground text-xs"
                  >
                    {searchTerm
                      ? "No transactions match your search filter."
                      : "No transactions recorded yet in the database."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="p-3.5">
                      <div className="font-bold text-foreground">{tx.id}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {tx.date}
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5">
                      <div className="font-medium text-foreground">
                        {tx.tenant}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {tx.customer}
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5 font-bold text-foreground">
                      {formatCurrency(tx.gross, tx.currency || primaryCurrency)}
                    </TableCell>
                    <TableCell className="p-3.5 font-bold text-primary">
                      +
                      {formatCurrency(
                        tx.platformFee,
                        tx.currency || primaryCurrency,
                      )}
                    </TableCell>
                    <TableCell className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        tx.tenantPayout,
                        tx.currency || primaryCurrency,
                      )}
                    </TableCell>
                    <TableCell className="p-3.5 text-[10px] text-muted-foreground max-w-55">
                      <div className="flex items-center gap-1.5">
                        <PaymentGatewayLogo gateway={tx.gateway} />
                        <span className="truncate">
                          {tx.gateway.includes("(")
                            ? `(${tx.gateway.split("(")[1]}`
                            : tx.gateway}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-2.5" />
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              <strong className="text-foreground">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, filteredTransactions.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-foreground">
                {filteredTransactions.length}
              </strong>{" "}
              records
            </span>

            {totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
