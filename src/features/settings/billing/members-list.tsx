"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface Member {
  id: string;
  role: string;
  createdAt: Date;
  organizationEmail?: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  totalMembers: number;
  onMemberRemoved: () => void;
}

export function MembersList({
  members,
  totalMembers,
  onMemberRemoved,
}: MembersListProps) {
  const utils = api.useUtils();
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const removeMemberMutation = api.team.removeMember.useMutation({
    onSuccess: async () => {
      toast.success("Member removed successfully");
      setRemovingMemberId(null);
      // Invalidate both team and billing caches
      await Promise.all([
        utils.team.getTeamOverview.invalidate(),
        utils.billing.listSubscriptions.invalidate(),
      ]);
      onMemberRemoved();
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
      setRemovingMemberId(null);
    },
  });

  const handleRemoveMember = (memberEmail: string, memberId: string) => {
    setRemovingMemberId(memberId);
    removeMemberMutation.mutate({ memberIdOrEmail: memberEmail });
  };

  const getInitials = (name: string | null, email: string | null, orgEmail?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    const displayEmail = orgEmail || email;
    if (displayEmail) {
      return displayEmail.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  if (members.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user.name, member.user.email, member.organizationEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.user.name || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.organizationEmail || member.user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {member.role.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(member.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removingMemberId === member.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove{" "}
                        <strong>{member.user.name || member.organizationEmail || member.user.email}</strong>{" "}
                        from the organization? This action cannot be undone and
                        they will lose access to all organization resources.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          (member.organizationEmail || member.user.email) &&
                          handleRemoveMember(member.organizationEmail || member.user.email!, member.id)
                        }
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove Member
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalMembers > members.length && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {members.length} of {totalMembers} members
        </div>
      )}
    </div>
  );
}