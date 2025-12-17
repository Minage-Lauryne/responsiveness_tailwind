"use client";
import { CheckIcon } from "@radix-ui/react-icons";
import { Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, LoadingButton } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/components/utils";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { toast } from "sonner";

interface UserSelectorProps {
  organizationId: string;
  currentMembers: Array<{
    id: string;
    organizationEmail?: string | null;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
    role: string;
  }>;
}

type UserForOrganization = {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  isMember: boolean;
  membership: {
    id: string;
    role: string;
    createdAt: Date;
  } | null;
};

export function UserSelector({
  organizationId,
  currentMembers,
}: UserSelectorProps) {
  const { data: users } =
    api.organization.adminListUsersForOrganization.useQuery({
      organizationId,
    });

  const utils = api.useUtils();

  const mutation = api.organization.adminChangeOrganizationMembers.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await Promise.all([
        utils.organization.listAdmin.invalidate(),
        utils.billing.listSubscriptions.invalidate(),
        utils.team.getTeamOverview.invalidate(),
      ]);
      toast.success("Organization members updated");
    },
    onError: (error) => {
      toast.error(`Failed to update members: ${error.message}`);
    },
  });

  const [isDialogueOpen, setOpen] = React.useState(false);

  // Initialize with current member user IDs
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(
    new Set(currentMembers?.map((m) => m.user.id)),
  );

  const usersToRemove = currentMembers?.filter(
    (m) => !selectedValues.has(m.user.id),
  );
  const usersToAdd = users?.filter(
    (u) =>
      selectedValues.has(u.id) &&
      !currentMembers?.find((m) => m.user.id === u.id),
  );

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Pencil size={10} />
            {currentMembers?.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="hidden space-x-1 lg:flex">
                  {currentMembers.slice(0, 3).map((member) => (
                    <Badge
                      variant="outline"
                      key={member.user.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {member.user.name ||
                        member.user.email?.split("@")[0] ||
                        (member.organizationEmail || member.user.email)?.split("@")[0] ||
                        "Unknown"}
                    </Badge>
                  ))}
                  {currentMembers.length > 3 && (
                    <Badge
                      variant="outline"
                      className="rounded-sm px-1 font-normal"
                    >
                      +{currentMembers.length - 3} more
                    </Badge>
                  )}
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="mr-8 w-[600px]" align="start">
          <Command>
            <CommandInput placeholder={"Search Users"} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {users
                  ?.sort(
                    // sort by selected first, then name.
                    (a, b) => {
                      if (
                        selectedValues.has(a.id) &&
                        !selectedValues.has(b.id)
                      ) {
                        return -1;
                      }
                      if (
                        !selectedValues.has(a.id) &&
                        selectedValues.has(b.id)
                      ) {
                        return 1;
                      }

                      // if name doesn't exist, sort by email
                      const aName = a.name ?? a.email ?? "";
                      const bName = b.name ?? b.email ?? "";

                      return aName.localeCompare(bName);
                    },
                  )
                  .map((user) => {
                    const isSelected = selectedValues.has(user.id);
                    return (
                      <CommandItem
                        className="flex cursor-pointer items-start"
                        key={user.id}
                        onSelect={() => {
                          if (isSelected) {
                            setSelectedValues(
                              new Set(
                                Array.from(selectedValues).filter(
                                  (id) => id !== user.id,
                                ),
                              ),
                            );
                          } else {
                            setSelectedValues(
                              new Set([...selectedValues, user.id]),
                            );
                          }
                          setOpen(true);
                        }}
                      >
                        <div
                          className={cn(
                            "mr-2 mt-1 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <CheckIcon className={cn("h-4 w-4")} />
                        </div>

                        <span>
                          <DisplayUser user={user} />
                        </span>
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isDialogueOpen} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Organization Members</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the organization members?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="mx-auto flex w-full space-x-4">
              {usersToRemove?.length > 0 && (
                <div className="flex flex-col">
                  <div className="font-semibold">Remove:</div>
                  {usersToRemove.map((member) => (
                    <Badge
                      variant="destructive"
                      key={member.user.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {member.user.name || member.organizationEmail || member.user.email || "Unknown"}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mx-auto flex w-full space-x-4">
              {usersToAdd && usersToAdd?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">Add:</div>
                  {usersToAdd.map((user) => (
                    <Badge
                      variant="default"
                      key={user.id}
                      className="rounded-sm px-1 font-normal"
                    >
                      {user.name || user.email || "Unknown"}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <strong>Resulting Members:</strong>
            <Separator />
            <div className="mx-auto flex w-full flex-col gap-2">
              {Array.from(selectedValues).map((id) => {
                const user = users?.find((u) => u.id === id);
                return (
                  <div key={id} className="flex items-center gap-2">
                    {user ? (
                      <DisplayUser user={user} />
                    ) : (
                      <div className="text-muted-foreground">
                        User not found
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <LoadingButton
              isLoading={mutation.isLoading}
              onClick={() => {
                mutation.mutate({
                  organizationId,
                  userIds: Array.from(selectedValues),
                });
              }}
            >
              Update Members
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DisplayUser({ user }: { user: UserForOrganization }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-1">
          <strong>
            {user.name || user.email?.split("@")[0] || "Unknown"}{" "}
          </strong>
          <span className="font-mono text-muted-foreground">
            {user.id.slice(-4)}{" "}
          </span>
          {user.isMember && (
            <Badge variant="outline" className="text-xs">
              Current Member
            </Badge>
          )}
        </div>

        <div className={"ml-4 flex w-full flex-row gap-2"}>
          <div className="text-sm text-muted-foreground">
            {user.email || "No email"}
          </div>
          {" | "}
          <div className="text-sm text-muted-foreground">
            Joined {formatDistanceToNow(user.createdAt, { addSuffix: true })}
          </div>
          {user.membership && (
            <>
              {" | "}
              <div className="text-sm text-muted-foreground">
                Role: {user.membership.role}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
