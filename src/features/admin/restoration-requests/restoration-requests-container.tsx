"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import * as React from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Mail, Calendar, UserX, Search, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import PageContainer from "@/features/dashboard-layout/page-container";
import { LoadingBlur } from "@/app/app/subject/components/loading-blur";

type RestorationRequest = {
  id: string;
  userId: string;
  status: string;
  requestedAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  rejectionReason: string | null;
  appealMessage: string | null;
  appealedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    deletedAt: Date | null;
  };
};

const getStatusBadge = (status: string, appealMessage: string | null = null) => {
  if (status === "REJECTED" && appealMessage) {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <Clock className="w-3 h-3 mr-1" />
        Appeal Pending
      </Badge>
    );
  }

  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    case "REJECTED_FINAL":
      return (
        <Badge variant="outline" className="text-red-800 border-red-800 bg-red-50">
          <XCircle className="w-3 h-3 mr-1" />
          Permanently Rejected
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

function ActionsCell({ request }: { request: RestorationRequest }) {
  const [showApproveDialog, setShowApproveDialog] = React.useState(false);
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const utils = api.useUtils();

  const approveMutation = api.user.approveRestoration.useMutation({
    onSuccess: () => {
      toast.success("Account restored successfully");
      void utils.user.listRestorationRequests.invalidate();
      setShowApproveDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve restoration");
    },
  });

  const rejectMutation = api.user.rejectRestoration.useMutation({
    onSuccess: () => {
      const hasAppeal = request.status === "REJECTED" && request.appealMessage;
      if (hasAppeal) {
        toast.success("Appeal rejected. This is a final decision and the user cannot appeal again.");
      } else {
        toast.success("Restoration request rejected. User has been notified and has 48 hours to appeal.");
      }
      void utils.user.listRestorationRequests.invalidate();
      setShowRejectDialog(false);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject restoration");
    },
  });

  // Show buttons for PENDING requests or REJECTED requests with appeals
  const hasAppeal = request.status === "REJECTED" && request.appealMessage;
  const canShowActions = request.status === "PENDING" || hasAppeal;

  if (!canShowActions) {
    return null;
  }

  return (
    <>
      <div className="flex gap-3">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowApproveDialog(true);
          }}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          className="px-3"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {hasAppeal ? "Approve Appeal" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            setShowRejectDialog(true);
          }}
          disabled={approveMutation.isPending || rejectMutation.isPending}
          className="px-3"
        >
          <XCircle className="h-4 w-4 mr-1" />
          {hasAppeal ? "Reject Appeal" : "Reject"}
        </Button>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasAppeal ? "Approve Appeal" : "Approve Restoration Request"}
            </DialogTitle>
            <DialogDescription>
              {hasAppeal 
                ? "This user has appealed their rejection. Approving will restore their account."
                : `This will restore the account for ${request.user.name || request.user.email}.`
              } Their analyses will be restored, but chats cannot be recovered.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} disabled={approveMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => approveMutation.mutate({ requestId: request.id })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : (hasAppeal ? "Approve Appeal" : "Approve Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={(open) => {
        setShowRejectDialog(open);
        if (!open) setRejectionReason("");
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="whitespace-nowrap">
              {hasAppeal ? "Reject Appeal" : "Reject Restoration Request"}
            </DialogTitle>
            <DialogDescription>
              {hasAppeal 
                ? `This user has appealed their rejection. Rejecting the appeal will permanently deny their restoration request and they will not be able to appeal again.`
                : `Please provide a reason for rejecting the restoration request from ${request.user.name || request.user.email}. The user will be notified and given 48 hours to appeal.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="rejection-reason" className="text-sm font-medium mb-2 block">
              Reason for {hasAppeal ? "Appeal " : ""}Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              onKeyDown={(e) => {
                // Ensure space key always works
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder={hasAppeal 
                ? "Explain why this appeal is being rejected..."
                : "Explain why this restoration request is being rejected..."
              }
              className="w-full min-h-[120px] px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
              disabled={rejectMutation.isPending}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {rejectionReason.length > 0 && rejectionReason.length < 10 && (
              <p className="text-xs text-red-500 mt-1">Reason must be at least 10 characters</p>
            )}
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }} 
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ 
                requestId: request.id,
                reason: rejectionReason,
              })}
              disabled={rejectMutation.isPending || rejectionReason.length < 10}
            >
              {rejectMutation.isPending ? "Rejecting..." : (hasAppeal ? "Reject Appeal" : "Reject Request")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RestorationRequestsList() {
  const { data: requests = [], isLoading } = api.user.listRestorationRequests.useQuery();
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);
  const [search, setSearch] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED">("ALL");
  const [expandedRequestId, setExpandedRequestId] = React.useState<string | null>(null);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredRequests = (requests || []).filter((request) => {
    if (selectedStatus !== "ALL") {
      if (selectedStatus === "REJECTED") {
        if (request.status !== "REJECTED" && request.status !== "REJECTED_FINAL") return false;
      } else if (request.status !== selectedStatus) {
        return false;
      }
    }
    
    if (!normalizedSearch) return true;
    const name = request.user?.name ?? "";
    const email = request.user?.email ?? "";
    return name.toLowerCase().includes(normalizedSearch) || email.toLowerCase().includes(normalizedSearch);
  });

  const total = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  
  React.useEffect(() => {
    if (pageIndex >= totalPages) {
      setPageIndex(Math.max(0, totalPages - 1));
    }
  }, [pageIndex, totalPages]);

  const paginatedRequests = React.useMemo(() => {
    const start = pageIndex * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, pageIndex, pageSize]);

  const toggleExpand = (id: string) =>
    setExpandedRequestId((prev) => (prev === id ? null : id));

  const handleRowKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand(id);
    }
  };

  if (isLoading) {
    return (
      <PageContainer 
        breadcrumbs={[
          { name: "Admin", href: "/app/admin" },
          { name: "Restoration Requests" }
        ]}
      maxWidth="full"
      >
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Restoration Requests</h1>
            <p className="text-muted-foreground">Review and manage account restoration requests from deleted users.</p>
          </div>
          <LoadingBlur loading={true} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      breadcrumbs={[
        { name: "Admin", href: "/app/admin" },
        { name: "Restoration Requests" }
      ]}
      maxWidth="full"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Restoration Requests</h1>
          <p className="text-muted-foreground">Review and manage account restoration requests from deleted users.</p>
        </div>

      <div className="space-y-6">
        <Tabs
          value={selectedStatus}
          onValueChange={(value) => {
            setSelectedStatus(value as typeof selectedStatus);
            setPageIndex(0);
            setExpandedRequestId(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            <TabsTrigger value="EXPIRED">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="mt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPageIndex(0);
                    }}
                    placeholder="Search by name or email"
                    className="w-full rounded-md border border-slate-200 px-10 py-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-300"
                  />
                </div>
              </div>

              {!filteredRequests || filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <UserX className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No restoration requests found</p>
                      <p className="text-sm mt-2">
                        {selectedStatus === "ALL" 
                          ? "Requests from deleted users will appear here."
                          : `No ${selectedStatus.toLowerCase()} requests found.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="bg-white rounded-md border border-slate-100 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-sky-50">
                          <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">User</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Requested</th>
                          <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Resolved</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Status</th>
                          <th className="px-6 py-4 text-center text-sm font-medium text-slate-700">Actions</th>
                          <th className="px-6 py-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRequests.map((request: RestorationRequest) => {
                          const isExpanded = expandedRequestId === request.id;
                          return (
                            <React.Fragment key={request.id}>
                              <tr
                                className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                                onClick={() => toggleExpand(request.id)}
                                onKeyDown={(e) => handleRowKeyDown(e as any, request.id)}
                                tabIndex={0}
                                role="button"
                                data-state={isExpanded ? "selected" : undefined}
                              >
                                <td className="px-6 py-4 align-top">
                                  <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarFallback>
                                        {request.user?.name
                                          ?.split(" ")
                                          .map((n: string) => n[0])
                                          .join("") || 
                                          request.user?.email?.slice(0, 2).toUpperCase() || 
                                          "??"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">
                                        {request.user?.name || "Unknown User"}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5" />
                                        <span className="truncate max-w-[220px]">
                                          {request.user?.email || "No email"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 align-top">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</span>
                                  </div>
                                </td>

                                <td className="px-6 py-4 align-top">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {request.resolvedAt ? (
                                      <>
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDistanceToNow(new Date(request.resolvedAt), { addSuffix: true })}</span>
                                      </>
                                    ) : (
                                      <span>—</span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-6 py-4 text-center align-top">
                                  {getStatusBadge(request.status, request.appealMessage)}
                                </td>

                                <td className="px-6 py-4 text-center align-top" onClick={(e) => e.stopPropagation()}>
                                  <ActionsCell request={request} />
                                </td>

                                <td className="px-6 py-4 align-top">
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform text-muted-foreground ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                  />
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-muted/10 px-6 py-4">
                                    <div className="ml-4 space-y-4">
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-muted-foreground">User ID:</span>
                                          <p className="mt-1 font-mono text-xs">{request.userId}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-muted-foreground">Request ID:</span>
                                          <p className="mt-1 font-mono text-xs">{request.id}</p>
                                        </div>
                                        {request.resolvedBy && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">Resolved By:</span>
                                            <p className="mt-1 font-mono text-xs">{request.resolvedBy}</p>
                                          </div>
                                        )}
                                        {request.user?.deletedAt && (
                                          <div>
                                            <span className="font-medium text-muted-foreground">Account Deleted:</span>
                                            <p className="mt-1 text-xs">
                                              {formatDistanceToNow(new Date(request.user.deletedAt), { addSuffix: true })}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                      
                                      {request.rejectionReason && (
                                        <div className="border-t pt-3">
                                          <span className="font-medium text-muted-foreground block mb-2">Rejection Reason:</span>
                                          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
                                            {request.rejectionReason}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {request.appealMessage && (
                                        <div className="border-t pt-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-muted-foreground">Appeal Message:</span>
                                            {request.appealedAt && (
                                              <span className="text-xs text-muted-foreground">
                                                (Submitted {formatDistanceToNow(new Date(request.appealedAt), { addSuffix: true })})
                                              </span>
                                            )}
                                          </div>
                                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm whitespace-pre-wrap">
                                            {request.appealMessage}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div>
                        <label className="inline-flex items-center gap-2">
                          <span>Show</span>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setPageIndex(0);
                            }}
                            className="rounded border px-2 py-1 text-sm"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                          <span>per page</span>
                        </label>
                      </div>
                      <div>
                        <span className="text-sm">
                          Showing <strong>{paginatedRequests.length}</strong> of <strong>{total}</strong> requests
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-sm text-muted-foreground">
                        Page {pageIndex + 1} of {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                          disabled={pageIndex === 0}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={pageIndex === totalPages - 1}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </PageContainer>
  );
}