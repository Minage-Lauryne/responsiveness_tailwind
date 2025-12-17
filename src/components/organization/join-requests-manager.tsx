"use client";

import * as React from "react";
import {
  Check,
  X,
  Clock,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  ChevronDown,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTablePagination from "@/components/ui/data-table/pagination";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { an } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export function JoinRequestsManager() {
  const [selectedStatus, setSelectedStatus] =
    React.useState<RequestStatus>("PENDING");

  const [selectedRequest, setSelectedRequest] = React.useState<string | null>(
    null
  );
  const [selectedRole, setSelectedRole] = React.useState<
    "ADMIN" | "MEMBER" | "VIEWER"
  >("MEMBER");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<"ACCEPT" | "REJECT" | null>(
    null
  );

  const [expandedRequestId, setExpandedRequestId] = React.useState<string | null>(
    null
  );

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);

  const { data: requests, isLoading, refetch } =
    api.organization.getJoinRequests.useQuery({
      status: selectedStatus,
    });

  const handleRequest = api.organization.handleJoinRequest.useMutation({
    onSuccess: (data) => {
      toast.success(`Request ${data.action} successfully`);
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAction = (requestId: string, action: "ACCEPT" | "REJECT") => {
    setSelectedRequest(requestId);
    setActionType(action);
    setIsDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;

    handleRequest.mutate({
      requestId: selectedRequest,
      action: actionType,
      ...(actionType === "ACCEPT" && { role: selectedRole }),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "ACCEPTED":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Check className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedRequestData = requests?.find((req: any) => req.id === selectedRequest);

  React.useEffect(() => {
    const total = requests?.length ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    if (pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [requests, pageIndex, pageSize]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const allRequests = requests ?? [];
  const pageCount = Math.max(1, Math.ceil(allRequests.length / pageSize));
  const paginatedRequests = allRequests.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  const tableLike = {
    getState: () => ({ pagination: { pageIndex, pageSize } }),
    getPageCount: () => pageCount,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPageIndex(0);
    },
    setPageIndex: (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, pageCount - 1));
      setPageIndex(clamped);
    },
    previousPage: () => tableLike.setPageIndex(pageIndex - 1),
    nextPage: () => tableLike.setPageIndex(pageIndex + 1),
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < pageCount - 1,
  };

  const toggleExpand = (id: string) =>
    setExpandedRequestId((prev) => (prev === id ? null : id));

  const handleRowKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpand(id);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={selectedStatus}
        onValueChange={(value) => {
          setSelectedStatus(value as RequestStatus);
          setPageIndex(0);
          setExpandedRequestId(null);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          {!allRequests || allRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No {selectedStatus.toLowerCase()} join requests</p>
                  <p className="text-sm mt-2">
                    {selectedStatus === "PENDING"
                      ? "New requests will appear here when users request to join your organization."
                      : `No ${selectedStatus.toLowerCase()} requests found.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div>
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-12">Name</TableHead>
                    <TableHead className="px-12 text-left">Received</TableHead>
                    <TableHead className="px-12">Status</TableHead>
                    <TableHead className="px-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedRequests.map((request: any) => {
                    const isExpanded = expandedRequestId === request.id;
                    return (
                      <React.Fragment key={request.id}>
                        <TableRow
                          data-state={isExpanded ? "selected" : undefined}
                          onClick={() => toggleExpand(request.id)}
                          onKeyDown={(e) => handleRowKeyDown(e as any, request.id)}
                          tabIndex={0}
                          role="button"
                          className="cursor-pointer"
                        >
                          <TableCell className="px-12 pb-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage src={request.user?.image || undefined} />
                                <AvatarFallback>
                                  {request.user?.name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || request.email.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {request.user?.name || "Unknown User"}
                                </div>
                                <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{request.email}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>



                          <TableCell className="px-12">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <span>{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                            </div>
                          </TableCell>

                          <TableCell className="px-12">
                            <div className="items-center min-w-0">
                              {getStatusBadge(request.status)}
                            </div>
                          </TableCell>

                          <TableCell className="px-8">
                            <div className="flex items-center gap-5">
                              {request.status === "PENDING" && (
                                <div className="flex gap-5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(request.id, "REJECT");
                                    }}
                                    disabled={handleRequest.isPending}
                                    className="px-3"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(request.id, "ACCEPT");
                                    }}
                                    disabled={handleRequest.isPending}
                                    className="px-3"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <ChevronDown
                              className={`h-4 w-4 ml-2 transition-transform text-muted-foreground ${isExpanded ? "rotate-180" : "rotate-0"}`}
                            />
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={4} className="bg-muted/10 px-6 py-4">
                              <div className="ml-4">
                                <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <div>{request.user?.location || "Location not provided"}</div>
                                </div>

                                {request.message && (
                                  <div className="flex items-start gap-3">
                                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium mb-1">Message from applicant:</p>
                                      <p className="text-sm text-muted-foreground">{request.message}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-6 px-2">
                <div className="w-full md:w-auto">
                  <DataTablePagination table={tableLike as unknown as any} />
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "ACCEPT" ? "Accept" : "Reject"} Join Request
            </DialogTitle>
            <DialogDescription>
              {actionType === "ACCEPT"
                ? `Accept ${selectedRequestData?.user?.name || selectedRequestData?.email} to join your organization?`
                : `Reject the join request from ${selectedRequestData?.user?.name || selectedRequestData?.email}?`}
            </DialogDescription>
          </DialogHeader>

          {actionType === "ACCEPT" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Role</label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: "ADMIN" | "MEMBER" | "VIEWER") =>
                    setSelectedRole(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">Viewer - Can only view analysis</SelectItem>
                    <SelectItem value="MEMBER">Member - Can create and view analysis</SelectItem>
                    <SelectItem value="ADMIN">Admin - Full organization management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={handleRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={handleRequest.isPending}
              variant={actionType === "REJECT" ? "destructive" : "default"}
            >
              {handleRequest.isPending ? "Processing..." : `${actionType === "ACCEPT" ? "Accept" : "Reject"} Request`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default JoinRequestsManager;