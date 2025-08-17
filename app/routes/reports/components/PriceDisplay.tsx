interface PriceDisplayProps {
  amount: number;
  currency?: string;
}

export function PriceDisplay({ amount, currency = 'Kč' }: PriceDisplayProps) {
  const formattedAmount = new Intl.NumberFormat('cs-CZ').format(Math.abs(amount));
  const isNegative = amount < 0;
  const colorClass = isNegative ? 'text-red-400' : 'text-green-400';
  const prefix = isNegative ? '-' : '+';

  return (
    <span className={`font-bold ${colorClass}`}>
      {prefix}{formattedAmount} {currency}
    </span>
  );
}
