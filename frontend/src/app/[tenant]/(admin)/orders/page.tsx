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

interface OrdersPageProps {
  params?: Promise<{
    tenant: string;
  }>;
}

interface OrderItem {
  id: string;
  customerName: string;
  customerEmail: string;
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
    <div className="p-4 md:p-6 lg:p-8 space-y-4 w-full">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-stone-400 z-10 pointer-events-none" />
            <Input
              placeholder="Search order ID, customer or gateway..."
              value={orderSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => handleStatusChange(val)}
          >
            <SelectTrigger className="h-9 w-40 text-xs bg-white border-stone-200 text-stone-700">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1">
            Auto-Payout: Active
          </Badge>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-stone-50 border-b border-stone-200/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Order ID
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Customer
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Gateway
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Total Amount
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Merchant Net (97.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Platform Fee (2.5%)
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500">
                Fulfillment Status
              </TableHead>
              <TableHead className="p-4 text-xs font-medium text-stone-500 text-right">
                Update
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-stone-100">
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="p-8 text-center text-stone-400"
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
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <TableCell className="p-4 font-mono font-bold text-stone-900 text-xs">
                      {ord.id}
                    </TableCell>
                    <TableCell className="p-4">
                      <div className="font-semibold text-stone-900">
                        {ord.customerName}
                      </div>
                      <div className="text-xs text-stone-400">
                        {ord.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge className="bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700">
                        {ord.gateway}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4 font-bold text-stone-900">
                      ${ord.grossAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4 font-bold text-emerald-600">
                      ${ord.netPayout.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4 text-stone-600">
                      ${ord.platformFee.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-4">
                      <Badge
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-transform cursor-pointer capitalize ${
                          ord.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ord.status === "shipped"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`text-xs ${
                            ord.status === "delivered"
                              ? "text-emerald-600"
                              : ord.status === "shipped"
                                ? "text-blue-600"
                                : "text-amber-600"
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
                        <SelectTrigger className="h-8 w-32 text-xs bg-white border-stone-200 text-stone-700 ml-auto">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
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
          <div className="p-4 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-stone-500">
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
