"use client";

import { startTransition, useOptimistic, useState } from "react";

// import { saveChatModelAsCookie } from '@/app/(chat)/actions';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { chatModels } from '@/lib/ai/models';
import { cn } from "@/lib/utils";

import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

const chatModels = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "The latest and most powerful language model from OpenAI",
  },
];

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  // const selectedChatModel = useMemo(
  //   () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
  //   [optimisticModelId],
  // );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:h-[34px] md:px-2"
        >
          test
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {chatModels.map((chatModel) => {
          const { id } = chatModel;

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticModelId(id);
                  alert("not implemented");
                });
              }}
              data-active={id === optimisticModelId}
              asChild
            >
              <button
                type="button"
                className="group/item flex w-full flex-row items-center justify-between gap-4"
              >
                <div className="flex flex-col items-start gap-1">
                  <div>{chatModel.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {chatModel.description}
                  </div>
                </div>

                <div className="text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
