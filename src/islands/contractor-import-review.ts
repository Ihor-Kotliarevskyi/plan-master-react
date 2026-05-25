type ContractorImportReviewEntry = Record<string, unknown>;
type ContractorImportRow = { row?: Record<string, unknown> };

type ContractorImportRuntime = Window & {
  _ctColumnExamples?: (rows: ContractorImportRow[], column: string) => string[];
  _ctImportEntryMatchesFilter?: (entry: ContractorImportReviewEntry, filter: string) => boolean;
};

const contractorImportRuntime = window as ContractorImportRuntime;
let importRowsState: ContractorImportRow[] = [];
let importReviewEntriesState: ContractorImportReviewEntry[] = [];

function syncImportMappingExamples(select: HTMLSelectElement): void {
  const field = select.dataset.field || "";
  const cell = document.querySelector<HTMLElement>(`.contractor-import-map-examples[data-field="${field}"]`);
  if (!cell) return;

  const rows = importRowsState;
  const examples = select.value && contractorImportRuntime._ctColumnExamples
    ? contractorImportRuntime._ctColumnExamples(rows, select.value)
    : [];

  if (!examples.length) {
    cell.innerHTML = `<span class="muted">-</span>`;
    return;
  }

  cell.textContent = examples.join(" | ");
}

function applyImportReviewFilter(filter: string): void {
  const entries = importReviewEntriesState;

  document.querySelectorAll<HTMLElement>("[data-import-filter]").forEach((card) => {
    card.classList.toggle("is-active", card.getAttribute("data-import-filter") === filter);
  });

  document.querySelectorAll<HTMLElement>("[data-import-review-row]").forEach((row) => {
    const entryIndex = Number(row.getAttribute("data-entry-index"));
    const entry = entries[entryIndex];
    row.hidden = contractorImportRuntime._ctImportEntryMatchesFilter
      ? !contractorImportRuntime._ctImportEntryMatchesFilter(entry, filter)
      : false;
  });
}

function initContractorImportReviewIsland(): void {
  document.addEventListener("change", (event) => {
    const target = event.target as HTMLElement | null;
    const select = target?.closest<HTMLSelectElement>(".contractor-import-map-select");
    if (!select) return;
    syncImportMappingExamples(select);
  });

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const filterCard = target?.closest<HTMLElement>("[data-import-filter]");
    if (!filterCard) return;
    applyImportReviewFilter(filterCard.getAttribute("data-import-filter") || "all");
  });

  document.addEventListener("contractor-import-review-open", (event: Event) => {
    const customEvent = event as CustomEvent<{ filter?: string }>;
    applyImportReviewFilter(customEvent.detail?.filter || "all");
  });

  document.addEventListener("contractor-import-mapping-open", (event: Event) => {
    const customEvent = event as CustomEvent<{ rows?: ContractorImportRow[] }>;
    importRowsState = Array.isArray(customEvent.detail?.rows) ? customEvent.detail.rows : [];
  });

  document.addEventListener("contractor-import-mapping-close", () => {
    importRowsState = [];
  });

  document.addEventListener("contractor-import-review-state", (event: Event) => {
    const customEvent = event as CustomEvent<{ entries?: ContractorImportReviewEntry[] }>;
    importReviewEntriesState = Array.isArray(customEvent.detail?.entries) ? customEvent.detail.entries : [];
  });

  document.addEventListener("contractor-import-review-close", () => {
    importReviewEntriesState = [];
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorImportReviewIsland, {
    once: true,
  });
} else {
  initContractorImportReviewIsland();
}

export {};
