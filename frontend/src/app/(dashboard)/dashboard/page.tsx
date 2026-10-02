"use client";

import { useState } from "react";
import {
  Cake,
  ShoppingBag,
  Clock,
  DollarSign,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useUserStore } from "@/store/user";

export default function DashboardPage() {
  const { user } = useUserStore();

  const stats = [
    {
      title: "Active Orders",
      value: "14",
      change: "+3 this week",
      icon: ShoppingBag,
    },
    {
      title: "Pending Inquiries",
      value: "8",
      change: "4 require quote",
      icon: Clock,
    },
    {
      title: "Revenue (MTD)",
      value: formatCurrency(12450),
      change: "+18.2% vs last month",
      icon: DollarSign,
    },
    {
      title: "Signature Flavors",
      value: "22",
      change: "3 seasonal featured",
      icon: Cake,
    },
  ];

  const recentOrders = [
    {
      id: "ORD-8492",
      client: "Amara & David",
      event: "3-Tier Floral Wedding Cake",
      flavor: "Tahitian Vanilla & Raspberry Coulis",
      date: "Aug 29, 2026",
      status: "In Production",
      amount: 1450,
    },
    {
      id: "ORD-8493",
      client: "Sophia Laurent",
      event: "Gold Foil 30th Birthday Cake",
      flavor: "Belgian Chocolate Hazelnut Crunch",
      date: "Aug 30, 2026",
      status: "Design Approved",
      amount: 420,
    },
    {
      id: "ORD-8494",
      client: "St. Jude Gala Committee",
      event: "120pc Macaron Tower & Petite Fours",
      flavor: "Pistachio, Passionfruit, Matcha",
      date: "Sep 02, 2026",
      status: "Scheduled",
      amount: 880,
    },
  ];

  const [page, setPage] = useState(1);
  const pageSize = 3;
  const totalPages = Math.ceil(recentOrders.length / pageSize) || 1;
  const paginatedOrders = recentOrders.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || "Chef"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is a snapshot of current studio orders and cake production.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="gap-2 shadow-xs cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>New Custom Order</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div>
            <h2 className="text-base font-semibold">Upcoming Custom Bakes</h2>
            <p className="text-xs text-muted-foreground">
              Deliveries and consultations scheduled for this week
            </p>
          </div>
          <Button variant="ghost" size="md" className="gap-1 text-xs">
            <span>View all</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            <TableRow className="hover:bg-transparent">
              <TableHead className="p-4 text-xs font-medium text-muted-foreground">
                Order ID
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-muted-foreground">
                Client
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-muted-foreground">
                Creation & Flavor
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-muted-foreground">
                Due Date
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-muted-foreground text-right">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {paginatedOrders.map((order) => (
              <TableRow
                key={order.id}
                className="hover:bg-muted/20 transition-colors"
              >
                <TableCell className="p-4 font-mono font-semibold text-primary text-xs">
                  {order.id}
                </TableCell>
                <TableCell className="p-4 font-medium text-xs">
                  {order.client}
                </TableCell>
                <TableCell className="p-4">
                  <div className="font-medium text-foreground text-xs">
                    {order.event}
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    {order.flavor}
                  </div>
                </TableCell>
                <TableCell className="p-4 text-muted-foreground text-xs">
                  {order.date}
                </TableCell>
                <TableCell className="p-4">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="p-4 text-right font-semibold text-xs">
                  {formatCurrency(order.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="text-[11px]">
            Showing {Math.min((page - 1) * pageSize + 1, recentOrders.length)}{" "}
            to {Math.min(page * pageSize, recentOrders.length)} of{" "}
            {recentOrders.length} orders
          </span>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, idx) => (
                <PaginationItem key={idx + 1}>
                  <PaginationLink
                    href="#"
                    isActive={page === idx + 1}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(idx + 1);
                    }}
                    className="cursor-pointer text-xs"
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
