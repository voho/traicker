export type EventContextInput = {
  dateIso: string;
  description: string;
  amount: number;
  currency: string;
  type?: string; // 'income' | 'expense' | other
};

// Returns a one-line markdown item summarizing the event.
// Example: "- 2025-09-07 • Coffee • -4.50 USD"
export const getEventContext = (event: EventContextInput) => {
  const date = event.dateIso?.slice(0, 10);
  const isExpense = event.type === 'expense';
  const isIncome = event.type === 'income';
  const signedAmount = isExpense
    ? -Math.abs(Number(event.amount))
    : isIncome
    ? Math.abs(Number(event.amount))
    : Number(event.amount);

  const amountStr = Number.isFinite(signedAmount)
    ? signedAmount.toFixed(2)
    : String(event.amount);

  const currency = event.currency ?? '';
  const description = event.description ?? '';

  return `- ${date} • ${description} • ${amountStr} ${currency}`.trim();
};

// Builds a markdown block for a list of events.
export const getEventsContextBlock = (events: EventContextInput[], title?: string) => {
  const header = title ? `# ${title}\n\n` : '';
  const lines = events.map(getEventContext).join("\n");
  return `${header}${lines}`.trim();
};

