import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "~/components/ui/Modal";
import { apiClient } from "~/globals";
import { storeEventSchema } from "~/schemas/event";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};


export function AddAiModal({ isOpen, onClose }: Props) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (p: string) => {
      // Local validation via shared schema
      const parsed = storeEventSchema.parse({ prompt: p });
      const res = await apiClient.api.store.$post({ json: parsed });
      if (!res.ok) {
        throw await res.json()
      }
      return await res.json();
    },
    onSuccess: () => {
      setPrompt("");
      setError(null);
      // Invalidate all queries without awaiting
      queryClient.invalidateQueries();
      // AI processing is async; invalidate again shortly after
      setTimeout(() => queryClient.invalidateQueries(), 1200);
      onClose();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : String(e));
    },
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Přidat záznam s AI"
      size="lg"
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
            type="submit"
            form="add-ai-form"
            className="px-3 py-2 text-sm text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!prompt.trim()}
          >
            Odeslat
          </button>
        </div>
      }
    >
      <form
        id="add-ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!prompt.trim()) return;
          mutate(prompt);
        }}
        className="space-y-3"
      >
        <label className="block text-sm text-gray-300">Vstup pro AI</label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Stručně popiš příjem nebo výdaj (částka, za co, kdy)"
          className="w-full p-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:ring-1 focus:ring-white/30 focus:border-transparent resize-y"
        />
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </form>
    </Modal>
  );
}
