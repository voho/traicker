import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "~/components/ui/Modal";
import { apiClient } from "~/globals";
import { manualEventSchema } from "~/schemas/event";
import type { InferResponseType } from "hono";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  initial: {
    dateIso?: string;
    description?: string;
    type?: "income" | "expense" | string;
    amount?: number;
    currency?: string;
  };
};

export function EditEventModal({ isOpen, onClose, eventId, initial }: Props) {
  const queryClient = useQueryClient();
  const toLocalDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [form, setForm] = useState({
    date: toLocalDate(initial.dateIso),
    description: initial.description ?? "",
    type: (initial.type === "income" || initial.type === "expense" ? initial.type : "expense") as
      | "income"
      | "expense",
    amount: initial.amount ? String(Math.abs(initial.amount)) : "",
    currency: (initial.currency ?? "CZK").toUpperCase(),
    categoryId: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        date: toLocalDate(initial.dateIso),
        description: initial.description ?? "",
        type:
          initial.type === "income" || initial.type === "expense"
            ? (initial.type as "income" | "expense")
            : "expense",
        amount: initial.amount ? String(Math.abs(initial.amount)) : "",
        currency: (initial.currency ?? "CZK").toUpperCase(),
        categoryId: (initial as any).categoryId ?? "",
      });
      setFieldErrors({});
      setError(null);
    }
  }, [isOpen, initial]);

  const update = (key: keyof typeof form, val: string) =>
    setForm((f) => {
      const next = { ...f, [key]: val };
      const candidate = {
        effective_at: next.date
          ? new Date(
              Date.UTC(
                new Date(next.date).getUTCFullYear(),
                new Date(next.date).getUTCMonth(),
                new Date(next.date).getUTCDate()
              )
            ).toISOString()
          : new Date(
              Date.UTC(
                new Date().getUTCFullYear(),
                new Date().getUTCMonth(),
                new Date().getUTCDate()
              )
            ).toISOString(),
        description: next.description,
        type: next.type,
        amount: parseFloat(next.amount || "0"),
        currency: next.currency,
        categoryId: next.categoryId || undefined,
      };
      const res = manualEventSchema.safeParse(candidate);
      if (!res.success) {
        setFieldErrors(res.error.flatten().fieldErrors as Record<string, string[]>);
      } else {
        setFieldErrors({});
      }
      return next;
    });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        effective_at: form.date
          ? new Date(
              Date.UTC(
                new Date(form.date).getUTCFullYear(),
                new Date(form.date).getUTCMonth(),
                new Date(form.date).getUTCDate()
              )
            ).toISOString()
          : new Date(
              Date.UTC(
                new Date().getUTCFullYear(),
                new Date().getUTCMonth(),
                new Date().getUTCDate()
              )
            ).toISOString(),
      description: form.description.trim(),
      type: form.type,
      amount: parseFloat(form.amount || "0"),
      currency: form.currency.toUpperCase(),
      categoryId: form.categoryId || undefined,
      };
      const parsed = manualEventSchema.parse(payload);
      const res = await apiClient.api.event[":eventId"].$put({ param: { eventId }, json: parsed });
      if (!res.ok) {
        throw await res.json()
      }
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all queries (no await) so visible data refreshes
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upravit záznam"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg bg-transparent transition-colors"
          >
            Zavřít
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            className="px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            disabled={isPending}
          >
            Uložit
          </button>
        </div>
      }
    >
      <form className="grid grid-cols-1 gap-3" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Datum</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
          />
          {fieldErrors.effective_at && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.effective_at[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Popis</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
          />
          {fieldErrors.description && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.description[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Typ</label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-white/30 focus:border-transparent"
            >
              <option value="expense">Výdaj</option>
              <option value="income">Příjem</option>
            </select>
            {fieldErrors.type && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.type[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Částka</label>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => update("amount", e.target.value)}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent"
            />
            {fieldErrors.amount && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.amount[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Měna</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value.toUpperCase())}
              maxLength={3}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent uppercase tracking-wider text-sm"
            />
            {fieldErrors.currency && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.currency[0]}</p>
            )}
          </div>
        </div>

        <CategorySelect value={form.categoryId} onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))} />

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </Modal>
  );
}

type Category = NonNullable<InferResponseType<typeof apiClient.api.categories.$get>>["categories"][number];
function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => apiClient.api.categories.$get().then((r) => r.json()),
  });
  const categories: Category[] = data?.categories ?? [];
  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">Kategorie</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-1 focus:ring-white/30 focus:border-transparent"
      >
        <option value="">(bez kategorie)</option>
        {categories.map((c) => (
          <option key={c.categoryId} value={c.categoryId}>
            {c.emoji ? `${c.emoji} ` : ""}{c.title}
          </option>
        ))}
      </select>
    </div>
  );
}
