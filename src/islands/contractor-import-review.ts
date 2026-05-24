type ContractorImportReviewEntry = Record<string, unknown>;

type ContractorImportRuntime = Window & {
  __contractorImportRows?: Array<{ row?: Record<string, unknown> }> | null;
  __contractorImportReviewEntries?: ContractorImportReviewEntry[] | null;
  _ctColumnExamples?: (rows: Array<{ row?: Record<string, unknown> }>, column: string) => string[];
  _ctImportEntryMatchesFilter?: (entry: ContractorImportReviewEntry, filter: string) => boolean;
};

const contractorImportRuntime = window as ContractorImportRuntime;

function syncImportMappingExamples(select: HTMLSelectElement): void {
  const field = select.dataset.field || "";
  const cell = document.querySelector<HTMLElement>(`.contractor-import-map-examples[data-field="${field}"]`);
  if (!cell) return;

  const rows = contractorImportRuntime.__contractorImportRows || [];
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
  const entries = contractorImportRuntime.__contractorImportReviewEntries || [];

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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initContractorImportReviewIsland, {
    once: true,
  });
} else {
  initContractorImportReviewIsland();
}

export {};
