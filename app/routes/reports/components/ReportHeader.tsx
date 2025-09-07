import { Link } from "react-router";
import { UserButton } from "@clerk/react-router";
import { useState } from "react";
import { AddAiModal } from "./modals/AddAiModal";
import { AddManualModal } from "./modals/AddManualModal";
import { PiMagicWand } from "react-icons/pi";
import { FiUser } from "react-icons/fi";

export const ReportHeader = () => {
  const [isAiOpen, setAiOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);

  return (
    <header className="flex justify-between items-center mb-8">
      <Link
        to="/"
        className="text-2xl font-bold hover:text-gray-300 transition-colors"
      >
        TraAIcker
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAiOpen(true)}
          className="px-3 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg bg-transparent transition-colors flex items-center gap-2"
          aria-label="Přidej s AI"
        >
          <PiMagicWand className="w-4 h-4" aria-hidden />
          <span>Přidej s AI</span>
        </button>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="px-3 py-2 text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg bg-transparent transition-colors flex items-center gap-2"
          aria-label="Přidej manuálně"
        >
          <FiUser className="w-4 h-4" aria-hidden />
          <span>Přidej manuálně</span>
        </button>
        <UserButton />
      </div>
      <AddAiModal isOpen={isAiOpen} onClose={() => setAiOpen(false)} />
      <AddManualModal isOpen={isManualOpen} onClose={() => setManualOpen(false)} />
    </header>
  );
};
