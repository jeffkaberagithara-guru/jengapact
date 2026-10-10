import { formatMoney, formatMoneyCompact, money } from "@/lib/money";
import type { CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/cn";

interface MoneyProps {
  minor: number;
  currency?: string;
  compact?: boolean;
  withSymbol?: boolean;
  className?: string;
}

export function Money({
  minor,
  currency = "KES",
  compact = false,
  withSymbol = true,
  className,
}: MoneyProps) {
  const value = money(minor, currency as CurrencyCode);
  const text = compact
    ? formatMoneyCompact(value)
    : formatMoney(value, { withSymbol });

  return <span className={cn("tabular", className)}>{text}</span>;
}
