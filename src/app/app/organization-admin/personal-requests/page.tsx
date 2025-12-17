"use client";
import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeader } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Trash2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const STATUS_MAP = { pending: "PENDING", accepted: "ACCEPTED", rejected: "REJECTED" } as const;

export default function PersonalRequestsPage() {
    const [tab, setTab] = React.useState<"pending" | "accepted" | "rejected">("pending");
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(10);
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const { data, isLoading, refetch } = api.organization.getMyJoinRequests.useQuery({ status: STATUS_MAP[tab] });

    const cancelRequest = api.organization.cancelMyJoinRequest.useMutation({
        onSuccess: () => {
            toast.success("Request cancelled");
            setDeleteId(null);
            refetch();
        },
        onError: (err: { message?: string }) => {
            toast.error(err.message ?? "Error cancelling request");
            setDeleteId(null);
        },
    });

    const mappedData: {
        id: string;
        organization: { name: string };
        requestedAt: string;
        acceptedAt?: string;
        status: "pending" | "accepted" | "rejected";
    }[] = React.useMemo(() => {
        if (!data) return [];
        return data
            .filter((r: any) => r.status === STATUS_MAP[tab])
            .map((r: any) => ({
                id: String(r.id),
                organization: { name: r.organization?.name ?? r.user?.name ?? r.email ?? "Unknown" },
                requestedAt: r.createdAt ? String(r.createdAt) : "",
                acceptedAt: r.status === "ACCEPTED" ? String(r.createdAt) : undefined,
                status: r.status === "PENDING" ? "pending" : r.status === "ACCEPTED" ? "accepted" : "rejected",
            }));
    }, [data, tab, STATUS_MAP]);

    const paged = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return mappedData.slice(start, start + pageSize);
    }, [mappedData, page, pageSize]);

    const totalPages = Math.max(1, Math.ceil(mappedData.length / pageSize));

    React.useEffect(() => {
        setPage(1);
    }, [tab, pageSize]);

    return (
        <div className="px-8 py-6">
            <h1 className="text-xl font-semibold mb-2">My Join Requests</h1>
            <p className="mb-6 text-muted-foreground">View the status of your organization membership requests.</p>

            <Tabs value={tab} onValueChange={v => setTab(v as "pending" | "accepted" | "rejected")}>
                <TabsList className="bg-[#e1f2fe] w-full mb-6">
                    <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                    <TabsTrigger value="accepted" className="flex-1">Accepted</TabsTrigger>
                    <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <RequestTable
                        requests={paged}
                        tab="pending"
                        isLoading={isLoading}
                        onDelete={id => setDeleteId(id)}
                    />
                </TabsContent>
                <TabsContent value="accepted">
                    <RequestTable
                        requests={paged}
                        tab="accepted"
                        isLoading={isLoading}
                    />
                </TabsContent>
                <TabsContent value="rejected">
                    <RequestTable
                        requests={paged}
                        tab="rejected"
                        isLoading={isLoading}
                    />
                </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between mt-8">
                <div className="flex items-center gap-2">
                    <Select value={pageSize.toString()} onValueChange={v => setPageSize(Number(v))}>
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm w-48 ml-2">per page</span>
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={page === 1 ? undefined : () => setPage(1)}
                                className={page === 1 ? "pointer-events-none opacity-60" : ""}
                            >
                                &laquo;
                            </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={page === 1 ? undefined : () => setPage(p => Math.max(1, p - 1))}
                                className={page === 1 ? "pointer-events-none opacity-60" : ""}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="px-2">Page {page} of {totalPages}</span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={page === totalPages ? undefined : () => setPage(p => Math.min(totalPages, p + 1))}
                                className={page === totalPages ? "pointer-events-none opacity-60" : ""}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={page === totalPages ? undefined : () => setPage(totalPages)}
                                className={page === totalPages ? "pointer-events-none opacity-60" : ""}
                            >
                                &raquo;
                            </PaginationLink>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Join Request?</DialogTitle>
                    </DialogHeader>
                    <div className="mb-4">
                        Are you sure you want to cancel your join request? This action cannot be undone.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && cancelRequest.mutate({ 
                                requestId: deleteId 
                            })}
                            disabled={cancelRequest.isPending}
                        >
                            {cancelRequest.isPending ? "Canceling..." : "Yes, cancel request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

type RequestTableProps = {
    requests: {
        id: string;
        organization: { name: string };
        requestedAt: string;
        acceptedAt?: string;
        status: "pending" | "accepted" | "rejected";
    }[];
    tab: "pending" | "accepted" | "rejected";
    isLoading: boolean;
    onDelete?: (id: string) => void;
};

function RequestTable({ requests, tab, isLoading, onDelete }: RequestTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>
                        {tab === "pending" ? "Requested Date" : tab === "accepted" ? "Accepted Date" : "Rejected Date"}
                    </TableHead>
                    <TableHead>Status</TableHead>
                    {tab === "pending" && <TableHead>Actions</TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={tab === "pending" ? 4 : 3}>
                            <div className="h-6 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                        </TableCell>
                    </TableRow>
                ) : requests.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={tab === "pending" ? 4 : 3} className="text-center text-muted-foreground">
                            No {tab} requests found.
                        </TableCell>
                    </TableRow>
                ) : (
                    requests.map((r) => (
                        <TableRow key={r.id}>
                            <TableCell>{r.organization.name}</TableCell>
                            <TableCell>
                                {formatDistanceToNowStrict(new Date(r.requestedAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="secondary"
                                    className={`border whitespace-nowrap text-sm font-medium rounded-full min-w-0 w-10 flex items-center gap-1
                    ${r.status === "pending"
                                            ? "border-yellow-400 text-yellow-700 bg-yellow-50 px-2"
                                            : r.status === "accepted"
                                            ? "border-green-400 text-green-700 bg-green-50 px-2"
                                            : "border-red-400 text-red-700 bg-red-50 px-2"
                                        }`}
                                    style={{ width: "125px", minWidth: "0", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
                                >
                                    {r.status === "pending"
                                        ? <Clock className="h-4 w-4" />
                                        : r.status === "accepted"
                                        ? <FileText className="h-4 w-4" />
                                        : <X className="h-4 w-4" />}
                                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                </Badge>
                            </TableCell>
                            {tab === "pending" && onDelete && (
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete request"
                                        onClick={() => onDelete(r.id)}
                                    >
                                        <Trash2 className="h-5 w-5 text-red-500" />
                                    </Button>
                                </TableCell>
                            )}
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}