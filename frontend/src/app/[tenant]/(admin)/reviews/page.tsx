"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Star, Search, Trash2, RefreshCw } from "lucide-react";
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
  getReviews,
  getReviewStats,
  updateReviewStatus,
  deleteReview,
  type ReviewItem,
  type ReviewStats,
} from "@/lib/api/reviews";

export default function TenantReviewsAdminPage() {
  const params = useParams();
  const activeTenantSlug = (params?.tenant as string) || "store";

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [reviewsRes, statsRes] = await Promise.all([
        getReviews({ tenantSlug: activeTenantSlug, perPage: 100 }),
        getReviewStats({ tenantSlug: activeTenantSlug }),
      ]);

      if (reviewsRes.status === "success" && reviewsRes.data?.items) {
        setReviews(reviewsRes.data.items);
      }
      if (statsRes.status === "success" && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
      toast.error("Could not load customer reviews.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTenantSlug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleStatusChange = async (
    reviewId: string,
    newStatus: "approved" | "pending" | "rejected",
  ) => {
    try {
      const res = await updateReviewStatus(
        reviewId,
        newStatus,
        activeTenantSlug,
      );
      if (res.status === "success") {
        toast.success(`Review status updated to ${newStatus}`);
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, status: newStatus } : r,
          ),
        );
        getReviewStats({ tenantSlug: activeTenantSlug }).then((sRes) => {
          if (sRes.status === "success" && sRes.data) setStats(sRes.data);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update review status.");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) {
      return;
    }
    try {
      const res = await deleteReview(reviewId, activeTenantSlug);
      if (res.status === "success") {
        toast.success("Review deleted successfully");
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        getReviewStats({ tenantSlug: activeTenantSlug }).then((sRes) => {
          if (sRes.status === "success" && sRes.data) setStats(sRes.data);
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete review.");
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.customer_email &&
          r.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.product_name &&
          r.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;

      const matchesRating =
        ratingFilter === "all" || r.rating === parseInt(ratingFilter, 10);

      return matchesSearch && matchesStatus && matchesRating;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedReviews = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, safeCurrentPage, pageSize]);

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

  return (
    <div className="space-y-5 w-full">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold font-secondary text-foreground">
              Customer Reviews & Ratings
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
            placeholder="Search by customer, product, or review text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background border-border text-foreground"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 text-xs w-35 bg-background border-border text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="h-9 text-xs w-35 bg-background border-border text-foreground">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="all">All Stars</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="border-border">
              <TableHead className="text-xs font-bold text-foreground">
                Customer & Product
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Rating
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Review & Feedback
              </TableHead>
              <TableHead className="text-xs font-bold text-foreground">
                Date
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
                <TableRow key={`review-skel-${i}`} className="border-border">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <Skeleton className="h-3.5 w-28 rounded-md" />
                        <Skeleton className="h-3 w-36 rounded-md" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-3.5 w-16 rounded-md" />
                      <Skeleton className="h-3.5 w-6 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-44 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-3.5 w-20 rounded-md" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Skeleton className="h-7 w-16 rounded-md" />
                      <Skeleton className="h-7 w-7 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedReviews.length === 0 ? (
              <TableRow className="border-border">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No reviews found matching the criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedReviews.map((r) => {
                return (
                  <TableRow
                    key={r.id}
                    className="border-border hover:bg-muted/40"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center font-bold text-xs text-primary">
                          {r.customer_name?.charAt(0)?.toUpperCase() || "C"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-foreground block truncate">
                            {r.customer_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            {r.product_name || "General Product"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">
                          {r.rating}.0
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      {r.title && (
                        <span className="font-semibold text-xs text-foreground block truncate">
                          {r.title}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {r.comment}
                      </p>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() =>
                          handleStatusChange(
                            r.id,
                            r.status === "approved" ? "rejected" : "approved",
                          )
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          r.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : r.status === "rejected"
                              ? "bg-rose-100 text-rose-800 hover:bg-rose-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                      >
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status !== "approved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "approved")}
                            className="h-7 text-xs px-2 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                          >
                            Approve
                          </Button>
                        )}
                        {r.status !== "rejected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "rejected")}
                            className="h-7 text-xs px-2 text-stone-600 hover:text-stone-900 bg-gray-200 hover:bg-gray-300 cursor-pointer"
                          >
                            Hide
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-rose-600 bg-red-100 hover:bg-red-200 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
