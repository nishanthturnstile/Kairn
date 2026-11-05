import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import * as Slot from "@radix-ui/react-slot";

const buttonVariants = cva(
  "atlas-button inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-normal transition-colors disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        quiet: "text-primary hover:bg-accent",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20  ",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground   ",
        secondary: "border bg-card text-primary hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground ",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2 has-[>svg]:px-3",
        xs: "min-h-11 gap-1 px-2 text-xs",
        sm: "min-h-11 gap-1.5 px-3",
        lg: "min-h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "min-h-11 min-w-11 p-2",
        "icon-xs": "min-h-11 min-w-11 p-2",
        "icon-sm": "min-h-11 min-w-11 p-2",
        "icon-lg": "min-h-12 min-w-12 p-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  pending = false,
  disabled,
  onClick,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    pending?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      type={asChild ? undefined : "button"}
      disabled={asChild ? undefined : disabled || pending}
      aria-disabled={disabled || pending || undefined}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (disabled || pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
