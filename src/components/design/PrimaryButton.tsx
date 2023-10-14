"use client";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function PrimaryButton({
  className,
  children,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      {...props}
      className={cn(
        "rounded-bl-3xlxl rounded-br-3xl rounded-tl-none rounded-tr-3xl drop-shadow-xl",
        className,
      )}
    >
      {children}
    </Button>
  );
}
