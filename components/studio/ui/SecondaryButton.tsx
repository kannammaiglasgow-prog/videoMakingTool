"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export default function SecondaryButton({ children, className = "", ...rest }: SecondaryButtonProps) {
  return (
    <button
      className={
        "flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...rest}
    >
      {children}
    </button>
  );
}
