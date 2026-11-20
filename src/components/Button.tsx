import React from "react";
import Link from "next/link";

type ButtonProps = {
  variant?: "primary" | "outline";
  className?: string;
  children: React.ReactNode;
} & (
  | ({ as?: "button"; href?: never } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  | ({ as: "link"; href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">)
);

export function Button({
  variant = "primary",
  className = "",
  children,
  as = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "h-14 px-9 rounded-full text-base font-medium flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles =
    variant === "primary"
      ? "bg-brand text-white hover:opacity-90 shadow-sm"
      : "border border-line bg-transparent text-ink hover:bg-surface";

  const combinedStyles = `${baseStyles} ${variantStyles} ${className}`.trim();

  if (as === "link" && "href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={combinedStyles} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={combinedStyles} {...buttonProps}>
      {children}
    </button>
  );
}
