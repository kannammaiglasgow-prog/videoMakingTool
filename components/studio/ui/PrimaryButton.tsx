"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
}

export default function PrimaryButton({ children, loading, className = "", disabled, ...rest }: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={
        "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition-all hover:from-purple-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}
