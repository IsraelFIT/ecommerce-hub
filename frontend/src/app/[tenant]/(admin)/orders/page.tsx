"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";

interface OrdersPageProps {
  params?: Promise<{
    tenant: string;
  }>;
}

interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  itemsCount: number;
  grossAmount: number;
  netPayout: number;
  platformFee: number;
  gateway: "Stripe Connect" | "Paystack Split";
  status: "paid" | "processing" | "shipped" | "delivered";
  createdAt: string;
}

export default function TenantOrdersPage({}: OrdersPageProps) {
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: "ORD-9421",
      customerName: "Sarah Jenkins",
      customerEmail: "sarah.j@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      itemsCount: 2,
      grossAmount: 448.0,
      netPayout: 436.8,
      platformFee: 11.2,
      gateway: "Stripe Connect",
      status: "processing",
      createdAt: "10 mins ago",
    },
    {
      id: "ORD-9420",
      customerName: "Tunde Adeyemi",
      customerEmail: "tunde.a@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      itemsCount: 1,
      grossAmount: 149.0,
      netPayout: 145.28,
      platformFee: 3.72,
      gateway: "Paystack Split",
      status: "paid",
      createdAt: "45 mins ago",
    },
    {
      id: "ORD-9419",
      customerName: "Marcus Vance",
      customerEmail: "marcus.v@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      itemsCount: 3,
      grossAmount: 241.0,
      netPayout: 234.97,
      platformFee: 6.03,
      gateway: "Stripe Connect",
      status: "shipped",
      createdAt: "3 hours ago",
    },
    {
      id: "ORD-9418",
      customerName: "Elena Rostova",
      customerEmail: "elena.r@example.com",
      customerAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      itemsCount: 1,
      grossAmount: 299.0,
      netPayout: 291.52,
      platformFee: 7.48,
      gateway: "Stripe Connect",
      status: "delivered",
      createdAt: "Yesterday",
    },
    {
      id: "ORD-9417",
      customerName: "Liam O'Connor",
      customerEmail: "liam.oc@example.com",
      itemsCount: 2,
      grossAmount: 180.0,
      netPayout: 175.5,
      platformFee: 4.5,
      gateway: "Paystack Split",
      status: "delivered",
      createdAt: "2 days ago",
    },
  ]);

  // Filters & Search
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const handleSearchChange = (val: string) => {
    setOrderSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    nextStatus: OrderItem["status"],
  ) => {
    setOrders(
      orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)),
    );
    toast.success(`Order ${orderId} updated to ${nextStatus}`);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.gateway.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 w-full text-foreground">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
            <Input
              placeholder="Search order ID, customer or gateway..."
              value={orderSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 bg-background border-border text-foreground"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => handleStatusChange(val)}
          >
            <SelectTrigger className="h-9 w-40 bg-background border-border text-foreground">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-3 py-1">
            Auto-Payout: Active
          </Badge>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60 border-b border-border">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Order ID
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Customer
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Gateway
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Total Amount
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Merchant Net (97.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Platform Fee (2.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground">
                Fulfillment Status
              </TableHead>
              <TableHead className="p-4 text-xs font-semibold text-foreground text-right">
                Update
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredOrders.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={8}
                  className="p-8 text-center text-muted-foreground"
                >
                  No orders found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((ord) => (
                  <TableRow
                    key={ord.id}
                    className="border-border hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="p-4  font-bold text-foreground text-xs">
                      {ord.id}
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={ord.customerAvatar}
                          name={ord.customerName}
                          email={ord.customerEmail}
                          size="sm"
                          shape="rounded"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground text-xs truncate">
                            {ord.customerName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {ord.customerEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge className="bg-muted border border-border px-2 py-1 text-xs font-medium text-foreground">
                        {ord.gateway}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 font-bold text-foreground">
                      ${ord.grossAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      ${ord.netPayout.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4 text-muted-foreground">
                      ${ord.platformFee.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-transform cursor-pointer capitalize ${
                          ord.status === "delivered"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : ord.status === "shipped"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <span
                          className={`text-xs ${
                            ord.status === "delivered"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : ord.status === "shipped"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 text-right">
                      <Select
                        value={ord.status}
                        onValueChange={(val) =>
                          handleUpdateOrderStatus(
                            ord.id,
                            val as OrderItem["status"],
                          )
                        }
                      >
                        <SelectTrigger className="h-8 w-32 text-xs bg-background border-border text-foreground ml-auto">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredOrders.length,
              )}{" "}
              to {Math.min(currentPage * pageSize, filteredOrders.length)} of{" "}
              {filteredOrders.length} orders
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
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from(
                  {
                    length: Math.ceil(filteredOrders.length / pageSize) || 1,
                  },
                  (_, idx) => (
                    <PaginationItem key={idx + 1}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === idx + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(idx + 1);
                        }}
                        className="cursor-pointer text-xs"
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (
                        currentPage <
                        Math.ceil(filteredOrders.length / pageSize)
                      )
                        setCurrentPage(currentPage + 1);
                    }}
                    className={
                      currentPage >= Math.ceil(filteredOrders.length / pageSize)
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
    </div>
  );
}
