import { AnimatePresence, motion } from "motion/react";
import { dismissAnchorWarning, useAnchorWarningStore } from "./anchor-warning-store";

export function AnchorWarningBanner() {
  const message = useAnchorWarningStore((s) => s.message);
  return (
    <AnimatePresence>
      {message && (
        <motion.button
          key="anchor-warning"
          type="button"
          onClick={dismissAnchorWarning}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
          className="pointer-events-auto absolute left-1/2 top-6 z-30 max-w-[90%] -translate-x-1/2 cursor-pointer rounded-lg border-0 px-3 py-2 text-left text-[13px]"
          style={{
            background: "var(--surface-card)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid var(--line-subtler)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
            color: "var(--text-secondary)",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
