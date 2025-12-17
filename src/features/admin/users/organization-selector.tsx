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
import { ViewUser, OrganizationOutput } from "@/features/admin/users/types";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { toast } from "sonner";
import { pluralize } from "@/lib/utils";

export function OrganizationSelector({ user }: { user: ViewUser }) {
  const { data: organizations } = api.organization.listAdmin.useQuery();

  const utils = api.useUtils();

  const mutation = api.organization.changeUserOrganizations.useMutation({
    onSuccess: async () => {
      setOpen(false);
      await utils.user.list.invalidate();
      toast.success("User organizations updated");
    },
    onError: (error) => {
      toast.error(`Failed to update organizations: ${error.message}`);
    },
  });

  const [isDialogueOpen, setOpen] = React.useState(false);

  // Initialize with user's current organizations
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(
    new Set(user.organizations?.map((o) => o.id)),
  );

  const organizationsToRemove = user.organizations?.filter(
    (o) => !selectedValues.has(o.id),
  );
  const organizationsToAdd = organizations?.filter(
    (o) =>
      selectedValues.has(o.id) &&
      !user.organizations?.find((uo) => uo.id === o.id),
  );

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            <Pencil size={10} />
            {user.organizations?.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-2 h-4" />
                <div className="hidden space-x-1 lg:flex">
                  {user.organizations.map((organization) => (
                    <Badge
                      variant="outline"
                      key={organization.name}
                      className="rounded-sm px-1 font-normal"
                    >
                      {organization.name}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="mr-8 w-[600px]" align="start">
          <Command>
            <CommandInput placeholder={"Search Organization"} />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {organizations
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

                      // if name doesn't exist, it sorts at the end.
                      if (!a.name) return 1;
                      if (!b.name) return -1;

                      return a.name.localeCompare(b.name);
                    },
                  )
                  .map((organization) => {
                    const isSelected = selectedValues.has(organization.id);
                    return (
                      <CommandItem
                        className="flex cursor-pointer items-start"
                        key={organization.id}
                        onSelect={() => {
                          if (isSelected) {
                            setSelectedValues(
                              new Set(
                                Array.from(selectedValues).filter(
                                  (id) => id !== organization.id,
                                ),
                              ),
                            );
                          } else {
                            setSelectedValues(
                              new Set([...selectedValues, organization.id]),
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
                          {organization ? (
                            <DisplayOrganization organization={organization} />
                          ) : (
                            "Organization not found"
                          )}
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
            <DialogTitle>Update User Organizations</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the user organizations?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="mx-auto flex w-full space-x-4">
              {organizationsToRemove?.length > 0 && (
                <div className="flex flex-col">
                  <div className="font-semibold">Remove from:</div>
                  {organizationsToRemove.map((organization) => (
                    <Badge
                      variant="destructive"
                      key={organization.name}
                      className="rounded-sm px-1 font-normal"
                    >
                      {organization.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="mx-auto flex w-full space-x-4">
              {organizationsToAdd && organizationsToAdd?.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="font-semibold">Add to:</div>
                  {organizationsToAdd.map((organization) => (
                    <Badge
                      variant="default"
                      key={organization.name}
                      className="rounded-sm px-1 font-normal"
                    >
                      {organization.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <strong>Resulting Organizations:</strong>
            <Separator />
            <div className="mx-auto flex w-full flex-col gap-2">
              {Array.from(selectedValues).map((id) => {
                const organization = organizations?.find((o) => o.id === id);
                return (
                  <div key={id} className="flex items-center gap-2">
                    {organization ? (
                      <DisplayOrganization organization={organization} />
                    ) : (
                      <div className="text-muted-foreground">
                        Organization not found
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
                  userId: user.id,
                  organizationIds: Array.from(selectedValues),
                });
              }}
            >
              Update User's Access
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DisplayOrganization({
  organization,
}: {
  organization: OrganizationOutput;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row gap-1">
          <strong>{organization.name} </strong>
          <span className="font-mono text-muted-foreground">
            {organization.id.slice(-4)}{" "}
          </span>
          {organization.domains && organization.domains.length > 0 && (
            <span className="text-sm text-muted-foreground">
              - {organization.domains.map((d) => d.domain).join(", ")}
            </span>
          )}
        </div>

        <div className={"ml-4 flex w-full flex-row gap-2"}>
          <div>
            Created{" "}
            {formatDistanceToNow(organization.createdAt, { addSuffix: true })}
          </div>{" "}
          | |{" "}
          <div>
            {organization.members.length}
            {` `}
            {pluralize(organization.members.length, "member", "members")}
          </div>
        </div>
      </div>
    </div>
  );
}
