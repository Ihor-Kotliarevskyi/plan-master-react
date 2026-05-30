import { useEffect, useState } from "react";
import { readFinanceSurfaceSnapshot, subscribeFinanceSurfaceSync } from "../bridge/finance-surface";
import type { FinanceSurfaceSnapshot } from "../types";

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { nodes?: Array<Element | null | undefined> }) => void;
    };
  }
}

function useFinanceSurfaceSnapshot() {
  const [snapshot, setSnapshot] = useState<FinanceSurfaceSnapshot>(() => readFinanceSurfaceSnapshot());

  useEffect(() => {
    const sync = () => setSnapshot(readFinanceSurfaceSnapshot());
    sync();
    return subscribeFinanceSurfaceSync(sync);
  }, []);

  return snapshot;
}

export function FinanceFiltersShell() {
  const snapshot = useFinanceSurfaceSnapshot();

  useEffect(() => {
    window.lucide?.createIcons({
      nodes: Array.from(document.querySelectorAll("#fin-filters [data-lucide]")),
    });
  }, [snapshot.capturedAt]);

  return <div dangerouslySetInnerHTML={{ __html: snapshot.filtersHtml }} />;
}

export function FinanceSummaryShell() {
  const snapshot = useFinanceSurfaceSnapshot();
  return <div dangerouslySetInnerHTML={{ __html: snapshot.summaryHtml }} />;
}

export function FinanceTableShell() {
  const snapshot = useFinanceSurfaceSnapshot();
  return <table dangerouslySetInnerHTML={{ __html: snapshot.tableHtml }} className="fin-tbl" />;
}
