import { Button, ButtonProps } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: ButtonProps["className"];
  buttonProps?: Omit<ButtonProps, "variant" | "size" | "className" | "asChild">;
};

const ButtonLink = React.forwardRef<HTMLButtonElement, ButtonLinkProps>(
  ({ className, variant, size, buttonProps, children, ...props }, ref) => {
    return (
      <Button variant={variant} size={size} className={className} {...buttonProps} asChild>
        <Link {...props}>{children}</Link>
      </Button>
    );
  }
);
ButtonLink.displayName = "ButtonLink";

export { ButtonLink };
