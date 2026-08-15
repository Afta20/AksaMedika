"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="inline-flex items-center justify-center rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50 transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 scale-100 transition-all dark:scale-0 dark:hidden" />
      <Moon className="h-5 w-5 scale-0 hidden transition-all dark:scale-100 dark:block" />
    </button>
  );
}
