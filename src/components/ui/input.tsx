import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-14 w-full rounded-full border border-zinc-200 bg-white px-6 py-4 text-zinc-600 placeholder:text-zinc-400 focus:border-primary/40 focus:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)] focus:outline-none focus:ring-0 focus:ring-offset-0 focus:transition-all focus:duration-200 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

const InputBlockInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full border-0 bg-transparent text-zinc-600 placeholder:text-zinc-400 focus:outline-none focus:ring-0 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
InputBlockInput.displayName = "InputBlockInput";

type InputBlockProps = {
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
} & InputProps;

const InputBlock = React.forwardRef<HTMLInputElement, InputBlockProps>(
  ({ className, leftIcon, rightIcon, ...input }, ref) => {
    return (
      <div
        className={cn(
          "flex h-14 w-full items-center rounded-full border border-zinc-200 bg-transparent px-6 py-4 transition duration-200 focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.05)]",
          className,
        )}
      >
        {leftIcon && <div className="mr-3">{leftIcon}</div>}
        <InputBlockInput {...input} ref={ref} />
        {rightIcon && <div className="ml-3">{rightIcon}</div>}
      </div>
    );
  },
);

export { Input, InputBlock };

Input.displayName = "Input";
InputBlock.displayName = "InputBlock";
