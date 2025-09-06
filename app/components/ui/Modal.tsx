import { useEffect, useMemo } from "react";
import ReactModal from "react-modal";
import type { ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  shouldCloseOnOverlayClick?: boolean;
  size?: ModalSize;
  className?: string;
  overlayClassName?: string;
  ariaHideApp?: boolean;
};

const sizeToWidth: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// Library-agnostic modal wrapper. Internally uses react-modal but exposes
// a stable, simple API. Swap internals later without changing callers.
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  shouldCloseOnOverlayClick = true,
  size = "md",
  className,
  overlayClassName,
  ariaHideApp,
}: ModalProps) {
  // Avoid SSR issues: only hide app in browser where document exists.
  const computedAriaHideApp = useMemo(() => {
    if (typeof window === "undefined") return false;
    return ariaHideApp ?? true;
  }, [ariaHideApp]);

  useEffect(() => {
    if (typeof document !== "undefined" && computedAriaHideApp) {
      // Best practice: set the app element for accessibility
      ReactModal.setAppElement("body");
    }
  }, [computedAriaHideApp]);

  const basePanel = `outline-none w-full ${sizeToWidth[size]} bg-gray-900 text-white rounded-xl shadow-xl border border-white/10`;
  const baseOverlay =
    "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4";

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      className={`${basePanel} ${className ?? ""}`.trim()}
      overlayClassName={`${baseOverlay} ${overlayClassName ?? ""}`.trim()}
      ariaHideApp={computedAriaHideApp}
      closeTimeoutMS={120}
    >
      {(title || onClose) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
          <div className="text-lg font-semibold text-white/90">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
            aria-label="Zavřít"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-4">{children}</div>

      {footer && (
        <div className="p-4 pt-4 mt-2 border-t border-white/10">{footer}</div>
      )}
    </ReactModal>
  );
}

// Optional helper for callers to keep API minimal if they need control.
export const modal = {
  // No-op now; can later expose provider-based APIs if modal library changes
};
