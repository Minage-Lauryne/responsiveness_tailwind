"use client";

import * as React from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { cn, truncateOrganizationName } from "@/lib/utils";
interface OrganizationSelectorProps {
  onOrganizationSelected?: () => void;
}

export function OrganizationSelector({ onOrganizationSelected }: OrganizationSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedOrg, setSelectedOrg] = React.useState<string>("");

  const { data: userInfo } = api.me.get.useQuery();
  const utils = api.useUtils();

  const setActiveOrganization = api.me.setActiveOrganization.useMutation({
    onSuccess: async () => {
      toast.success("Organization selected successfully");
      await utils.invalidate();
      onOrganizationSelected?.();
      
      // Always redirect to home when switching organizations
      // This ensures users don't stay on pages that might not exist in the new context
      window.location.href = "/app";
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const organizations = userInfo?.organizations || [];

  const handleSelectOrganization = async (organizationId: string | null) => {
    setSelectedOrg(organizationId || "");
    setOpen(false);
    
    try {
      await setActiveOrganization.mutateAsync({ organizationId });
    } catch (error) {
      console.error("Failed to set active organization:", error);
    }
  };

  if (organizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            No Organizations Found
          </CardTitle>
          <CardDescription>
            You are not a member of any organization. Please join or create an organization to continue.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Select Organization
        </CardTitle>
        <CardDescription>
          Please select an organization to continue using the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={setActiveOrganization.isLoading}
            >
              {selectedOrg
                ? truncateOrganizationName(organizations.find((org) => org.id === selectedOrg)?.name || "")
                : "Select organization..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search organizations..." />
              <CommandList>
                <CommandEmpty>No organizations found.</CommandEmpty>
                <CommandGroup>
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={org.id}
                      onSelect={() => handleSelectOrganization(org.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedOrg === org.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{truncateOrganizationName(org.name)}</span>
                        <span className="text-sm text-muted-foreground">
                          {org.role} • {org.memberCount} members
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {setActiveOrganization.isLoading && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Setting active organization...
          </div>
        )}
      </CardContent>
    </Card>
  );
}