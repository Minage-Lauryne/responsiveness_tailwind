import { type GenericIcon } from "@/components/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface MenuButtonProps {
  icon: GenericIcon;
  label: string;
  href: string;
  active: boolean;
  isOpen?: boolean;
}

export function MenuButton({
  icon: Icon,
  label,
  href,
  active,
  isOpen,
}: MenuButtonProps) {
  return (
    <TooltipProvider disableHoverableContent>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "mb-2 flex h-12 w-full items-center justify-center rounded-full px-3 transition-all duration-300 ease-in-out",
              isOpen ? "justify-start" : "justify-center",
              active && "bg-muted",
            )}
            asChild
          >
            <Link href={href} className="flex items-center">
              <div
                className={cn(
                  "transition-margin flex h-10 w-10 items-center justify-center rounded-full duration-300 ease-in-out",
                  isOpen ? "mr-3" : "",
                )}
              >
                <Icon size={20} />
              </div>
              {isOpen && (
                <span className="overflow-hidden whitespace-nowrap text-sm font-medium opacity-100 transition-opacity duration-200 ease-in-out">
                  {label}
                </span>
              )}
            </Link>
          </Button>
        </TooltipTrigger>
        {!isOpen && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
