"use client";
import React from "react";
import { toast } from "sonner";
import { Button, LoadingButton } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { InputBlock } from "@/components/ui/input";
import { api } from "@/trpc/react";

export function CreateUserModal() {
  const [open, setOpen] = React.useState(false);
  const utils = api.useUtils();

  const [email, setEmail] = React.useState("");

  const mutation = api.user.addUser.useMutation({
    onSuccess: async (data) => {
      await utils.user.list.invalidate();
      toast.success(`User ${data.email} invted to beta program`);
      setOpen(false);
    },
    onError: (error) => {
      if (error.message === "User already exists") {
        toast.error("User already exists");
        return;
      }
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen} aria-label="Add User">
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Add Beta User
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <div className="flex flex-col items-start gap-4">
          <div>
            {" "}
            Enter the email address of the user you would like to invite to the
            beta program.{" "}
          </div>
          <InputBlock
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full"
          />

          <div className="flex w-full flex-row justify-between">
            <LoadingButton
              isLoading={mutation.isLoading}
              disabled={!email || emailIsInvalid(email)}
              onClick={() => {
                mutation.mutate({
                  email,
                });
              }}
            >
              Add User
            </LoadingButton>

            <Button
              variant="outline"
              className="w-fit"
              onClick={() => {
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function emailIsInvalid(email: string) {
  return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
