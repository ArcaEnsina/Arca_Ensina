import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleGroupVariants = cva(
  "group/toggle-group flex items-center justify-center gap-1",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent",
      },
      size: {
        default: "h-11 min-h-11 min-w-11",
        sm: "h-10 min-h-11 min-w-11",
        lg: "h-11 min-h-11 min-w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleGroupVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(toggleGroupVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleGroupVariants>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-3xl text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=outline]/toggle-group:border-input",
        "group-data-[size=default]/toggle-group:h-11 group-data-[size=default]/toggle-group:min-h-11 group-data-[size=default]/toggle-group:min-w-11 group-data-[size=default]/toggle-group:px-3",
        "group-data-[size=sm]/toggle-group:h-10 group-data-[size=sm]/toggle-group:min-h-11 group-data-[size=sm]/toggle-group:min-w-11 group-data-[size=sm]/toggle-group:px-3",
        "group-data-[size=lg]/toggle-group:h-11 group-data-[size=lg]/toggle-group:min-h-11 group-data-[size=lg]/toggle-group:min-w-11 group-data-[size=lg]/toggle-group:px-4",
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
