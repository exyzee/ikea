import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
};

type LinkButtonProps = BaseProps & {
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

type NativeButtonProps = BaseProps & {
  href?: undefined;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseStyles =
  "inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] rounded-[2px] border transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0058a3] disabled:opacity-60 disabled:cursor-not-allowed";

const variantStyles: Record<NonNullable<BaseProps["variant"]>, string> = {
  primary: "bg-[#0058a3] border-[#0058a3] text-white hover:bg-[#004b8a]",
  secondary: "bg-white border-[#0f0f0f] text-gray-900 hover:bg-gray-50",
  ghost: "bg-transparent border-transparent text-gray-800 underline-offset-4 hover:underline"
};

export function Button(props: LinkButtonProps): JSX.Element;
export function Button(props: NativeButtonProps): JSX.Element;
export function Button({ children, variant = "primary", className, href, ...rest }: LinkButtonProps | NativeButtonProps) {
  const styles = cn(baseStyles, variantStyles[variant], className);

  if (href) {
    const { href: _href, ...anchorProps } = rest as LinkButtonProps;
    return (
      <Link href={href} className={styles} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...(rest as NativeButtonProps)}>
      {children}
    </button>
  );
}
