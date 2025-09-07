type Props = {
  onSelected: (emoji: string) => void;
  className?: string;
};

const EMOJIS = [
  "💰", // finance
  "💳", // card
  "🏦", // bank
  "🧾", // receipt/bills
  "🛒", // groceries/shopping
  "🍎", // groceries
  "🍕", // eating out
  "☕", // coffee
  "⛽", // fuel
  "🚗", // car
  "🚆", // transport
  "🏠", // housing/rent
  "🔌", // utilities
  "📱", // phone
  "🌐", // internet
  "👕", // clothes
  "💊", // pharmacy
  "🏋️", // fitness
  "✈️", // travel
  "🎁", // gifts
];

export function FavoriteEmojis({ onSelected, className }: Props) {
  return (
    <div className={className}>
      <div className="text-xs text-gray-400 mb-1">Oblíbené emoji</div>
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onSelected(e)}
            className="px-2 py-1 rounded-md border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-base leading-none"
            aria-label={`Vybrat emoji ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
