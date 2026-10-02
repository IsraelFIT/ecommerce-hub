"use client";

import { useState } from "react";
import {
  DollarSign,
  Building2,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Download,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/helper";
import { toast } from "sonner";

export default function CoreRevenuePage() {
  const [isSettling, setIsSettling] = useState(false);

  const handleSettle = () => {
    setIsSettling(true);
    setTimeout(() => {
      setIsSettling(false);
      toast.success(
        "All escrow balances settled and payouts initiated via Stripe & Paystack!",
      );
    }, 1200);
  };

  const revenueMetrics = [
    {
      title: "Total Platform GMV",
      value: "$284,520.00",
      change: "+18.4% vs last mo",
      subtitle: "Gross merchandise processed",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Platform Fees Accrued (2.5%)",
      value: "$7,113.00",
      change: "+22.1% vs last mo",
      subtitle: "Net platform take-rate",
      icon: Percent,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Tenant Escrow Balance",
      value: "$277,407.00",
      change: "Pending Payout",
      subtitle: "Stripe & Paystack subaccounts",
      icon: Building2,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "Platform Payout Ratio",
      value: "97.5% / 2.5%",
      change: "Auto Split Active",
      subtitle: "Zero-latency automated routing",
      icon: ShieldCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const splitTransactions = [
    {
      id: "SPLIT-1092",
      orderId: "ORD-8392",
      tenant: "Jazz Cakes LTD",
      customer: "Amara Johnson",
      gross: 240.0,
      feePercent: "2.5%",
      platformFee: 6.0,
      tenantPayout: 234.0,
      gateway: "Paystack Split (ACCT_7493021948)",
      status: "Settled",
      date: "Oct 2, 2026 09:42 AM",
    },
    {
      id: "SPLIT-1091",
      orderId: "ORD-8391",
      tenant: "Velvet Couture Atelier",
      customer: "Kelechi Obi",
      gross: 1250.0,
      feePercent: "2.5%",
      platformFee: 31.25,
      tenantPayout: 1218.75,
      gateway: "Stripe Connect (acct_1NZX8302183)",
      status: "Settled",
      date: "Oct 2, 2026 09:15 AM",
    },
    {
      id: "SPLIT-1090",
      orderId: "ORD-8390",
      tenant: "Nordic Minimalist Home",
      customer: "Sarah Jenkins",
      gross: 480.0,
      feePercent: "2.5%",
      platformFee: 12.0,
      tenantPayout: 468.0,
      gateway: "Paystack Split (ACCT_8839201940)",
      status: "Settled",
      date: "Oct 2, 2026 08:30 AM",
    },
    {
      id: "SPLIT-1089",
      orderId: "ORD-8389",
      tenant: "Aura Artisan Coffee",
      customer: "David Chen",
      gross: 85.0,
      feePercent: "2.5%",
      platformFee: 2.13,
      tenantPayout: 82.87,
      gateway: "Stripe Connect (acct_1MKL8392011)",
      status: "Settled",
      date: "Oct 2, 2026 07:54 AM",
    },
    {
      id: "SPLIT-1088",
      orderId: "ORD-8388",
      tenant: "Solstice Organic Skincare",
      customer: "Fatima Al-Mansoor",
      gross: 310.0,
      feePercent: "2.5%",
      platformFee: 7.75,
      tenantPayout: 302.25,
      gateway: "Paystack Split (ACCT_3392019481)",
      status: "Settled",
      date: "Oct 1, 2026 11:20 PM",
    },
  ];

  return (
    <div className="flex flex-col gap-5 w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-secondary text-foreground">
            Platform Revenue & Payment Split Routing
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated 2.5% platform fee deduction and 97.5% subaccount escrow
            distribution
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="md"
            variant="outline"
            className="gap-1.5 h-8 text-xs cursor-pointer"
            onClick={() => toast.success("Exporting revenue CSV report...")}
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="md"
            disabled={isSettling}
            onClick={handleSettle}
            className="gap-1.5 h-8 text-xs cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw
              className={`size-3.5 ${isSettling ? "animate-spin" : ""}`}
            />
            <span>{isSettling ? "Settling..." : "Trigger Escrow Payouts"}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {revenueMetrics.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-xs"
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

              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-bold font-secondary text-foreground tracking-tight">
                  {stat.value}
                </h3>
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
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
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            %
          </div>
          <div>
            <h4 className="text-sm font-bold font-secondary text-foreground">
              Dynamic Take-Rate Protocol (2.5% Platform Cut)
            </h4>
            <p className="text-xs text-muted-foreground">
              Every checkout dynamically computes the 2.5% platform fee and
              transfers 97.5% directly to the tenant&apos;s Paystack subaccount
              or Stripe Connected account.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/30 font-mono text-xs shrink-0"
        >
          SPLIT_CONFIG_ACTIVE
        </Badge>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-card-gray/20 dark:bg-white/5">
          <h4 className="text-xs font-bold font-secondary text-foreground">
            Escrow Split Audit Log
          </h4>
          <span className="text-[11px] text-muted-foreground font-mono">
            Showing latest settlement records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-card-gray/30 dark:bg-white/5 text-[11px] text-muted-foreground">
                <th className="p-3.5 font-medium">Split ID / Date</th>
                <th className="p-3.5 font-medium">Tenant Store</th>
                <th className="p-3.5 font-medium">Gross Amount</th>
                <th className="p-3.5 font-medium text-primary">
                  Platform 2.5%
                </th>
                <th className="p-3.5 font-medium text-emerald-600 dark:text-emerald-400">
                  Tenant 97.5%
                </th>
                <th className="p-3.5 font-medium">Subaccount Routing</th>
                <th className="p-3.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {splitTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3.5 font-mono">
                    <div className="font-bold text-foreground">{tx.id}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {tx.date}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-foreground">
                      {tx.tenant}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {tx.customer}
                    </div>
                  </td>
                  <td className="p-3.5 font-bold font-mono text-foreground">
                    {formatCurrency(tx.gross)}
                  </td>
                  <td className="p-3.5 font-bold font-mono text-primary">
                    +{formatCurrency(tx.platformFee)}
                  </td>
                  <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(tx.tenantPayout)}
                  </td>
                  <td className="p-3.5 font-mono text-[10px] text-muted-foreground max-w-55 truncate">
                    {tx.gateway}
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="size-2.5" />
                      {tx.status}
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
