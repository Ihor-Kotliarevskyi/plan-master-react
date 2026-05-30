import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { shouldMountReactHost } from "./bridge/legacy-app";
import { AuditViewerModal } from "./components/audit-viewer-modal";
import { ChartEditModal } from "./components/chart-edit-modal";
import { ChartSurface } from "./components/chart-surface";
import { DependencyListModal } from "./components/dependency-list-modal";
import { GanttLegend, GanttTable, GanttToolbar } from "./components/gantt-surface";
import { NotesModal } from "./components/notes-modal";
import { ContractorSurface } from "./components/contractor-surface";
import { ContractorEntryModal } from "./components/contractor-entry-modal";
import { ContractorDialogModal } from "./components/contractor-dialog-modal";
import { PaymentRegisterModal } from "./components/payment-register-modal";
import { ContractorImportMappingModal } from "./components/contractor-import-mapping-modal";
import { ContractorImportReviewModal } from "./components/contractor-import-review-modal";
import { FinanceFiltersShell, FinanceSummaryShell, FinanceTableShell } from "./components/finance-surface";
import { PrintDialogModal } from "./components/print-dialog-modal";
import { AppShellAccessBanner, AppShellHeader, AppShellTabs } from "./components/app-shell-main";
import { ProjectManagerModal } from "./components/project-manager-modal";
import { ProjectSettingsModal } from "./components/project-settings-modal";
import { ReactHostShell } from "./components/react-host-shell";
import { ShareModal } from "./components/share-modal";
import { TaskModal } from "./components/task-modal";
import { UserCabinetShell } from "./components/user-cabinet-shell";
import { ReactHostProvider } from "./providers/react-host-provider";
import "./react-host.css";

type ReactRuntimeWindow = Window & {
  renderContractors?: () => void;
  updateCbCatFilter?: () => void;
  renderAutoCharts?: () => void;
};

function mountReactHost() {
  if (!shouldMountReactHost()) return;

  document.body.dataset.reactTransitionMainShell = "enabled";

  const host = document.querySelector<HTMLElement>("[data-react-transition-host]");
  if (host) {
    host.hidden = false;
    createRoot(host).render(
      <StrictMode>
        <ReactHostProvider>
          <ReactHostShell />
        </ReactHostProvider>
      </StrictMode>,
    );
  }

  const userCabinetBody = document.getElementById("user-modal-body");
  if (userCabinetBody) {
    document.body.dataset.reactTransitionUserCabinet = "enabled";
    createRoot(userCabinetBody).render(
      <StrictMode>
        <UserCabinetShell />
      </StrictMode>,
    );
  }

  const auditHost = document.createElement("div");
  auditHost.id = "react-audit-viewer-root";
  document.body.appendChild(auditHost);
  createRoot(auditHost).render(
    <StrictMode>
      <AuditViewerModal />
    </StrictMode>,
  );

  const shareHost = document.createElement("div");
  shareHost.id = "react-share-modal-root";
  document.body.appendChild(shareHost);
  createRoot(shareHost).render(
    <StrictMode>
      <ShareModal />
    </StrictMode>,
  );

  const appHead = document.querySelector<HTMLElement>(".app-head");
  if (appHead) {
    createRoot(appHead).render(
      <StrictMode>
        <AppShellHeader />
      </StrictMode>,
    );
  }

  const tabs = document.querySelector<HTMLElement>(".tabs");
  if (tabs) {
    createRoot(tabs).render(
      <StrictMode>
        <AppShellTabs />
      </StrictMode>,
    );
  }

  const accessBanner = document.getElementById("project-access-banner");
  if (accessBanner) {
    createRoot(accessBanner).render(
      <StrictMode>
        <AppShellAccessBanner />
      </StrictMode>,
    );
  }

  const projectManagerModal = document.querySelector<HTMLElement>("[data-project-manager-root] .modal");
  if (projectManagerModal) {
    document.body.dataset.reactTransitionProjectManager = "enabled";
    createRoot(projectManagerModal).render(
      <StrictMode>
        <ProjectManagerModal />
      </StrictMode>,
    );
  }

  const chartEditModal = document.querySelector<HTMLElement>("[data-chart-edit-root] .modal");
  if (chartEditModal) {
    document.body.dataset.reactTransitionChartEdit = "enabled";
    createRoot(chartEditModal).render(
      <StrictMode>
        <ChartEditModal />
      </StrictMode>,
    );
  }

  const chartPane = document.getElementById("pane-charts");
  if (chartPane) {
    document.body.dataset.reactTransitionChartSurface = "enabled";
    createRoot(chartPane).render(
      <StrictMode>
        <ChartSurface />
      </StrictMode>,
    );
    const runtimeWindow = window as ReactRuntimeWindow;
    runtimeWindow.updateCbCatFilter?.();
    runtimeWindow.renderAutoCharts?.();
  }

  const projectSettingsModal = document.querySelector<HTMLElement>("[data-project-settings-root] .modal");
  if (projectSettingsModal) {
    document.body.dataset.reactTransitionProjectSettings = "enabled";
    createRoot(projectSettingsModal).render(
      <StrictMode>
        <ProjectSettingsModal />
      </StrictMode>,
    );
  }

  const taskModal = document.querySelector<HTMLElement>("[data-task-modal-root] .modal");
  if (taskModal) {
    document.body.dataset.reactTransitionTaskModal = "enabled";
    createRoot(taskModal).render(
      <StrictMode>
        <TaskModal />
      </StrictMode>,
    );
  }

  const notesModal = document.querySelector<HTMLElement>("[data-notes-modal-root] .modal");
  if (notesModal) {
    document.body.dataset.reactTransitionNotesModal = "enabled";
    createRoot(notesModal).render(
      <StrictMode>
        <NotesModal />
      </StrictMode>,
    );
  }

  const dependencyListModal = document.querySelector<HTMLElement>("[data-dep-list-root] .modal");
  if (dependencyListModal) {
    document.body.dataset.reactTransitionDependencyList = "enabled";
    createRoot(dependencyListModal).render(
      <StrictMode>
        <DependencyListModal />
      </StrictMode>,
    );
  }

  const legend = document.getElementById("legend");
  if (legend) {
    document.body.dataset.reactTransitionGanttSurface = "enabled";
    createRoot(legend).render(
      <StrictMode>
        <GanttLegend />
      </StrictMode>,
    );
  }

  const ganttToolbar = document.getElementById("gantt-toolbar");
  if (ganttToolbar) {
    createRoot(ganttToolbar).render(
      <StrictMode>
        <GanttToolbar />
      </StrictMode>,
    );
  }

  const ganttTable = document.getElementById("gtbl-wrap");
  if (ganttTable) {
    createRoot(ganttTable).render(
      <StrictMode>
        <GanttTable />
      </StrictMode>,
    );
  }

  const contractorPage = document.querySelector<HTMLElement>("#pane-contractors .contractor-page");
  if (contractorPage) {
    document.body.dataset.reactTransitionContractorSurface = "enabled";
    createRoot(contractorPage).render(
      <StrictMode>
        <ContractorSurface />
      </StrictMode>,
    );
    (window as ReactRuntimeWindow).renderContractors?.();
  }

  const paymentRegisterModal = document.querySelector<HTMLElement>("[data-payment-register-root] .modal");
  if (paymentRegisterModal) {
    document.body.dataset.reactTransitionPaymentRegister = "enabled";
    createRoot(paymentRegisterModal).render(
      <StrictMode>
        <PaymentRegisterModal />
      </StrictMode>,
    );
  }

  const printDialogModal = document.querySelector<HTMLElement>("[data-print-dialog-root] .modal");
  if (printDialogModal) {
    document.body.dataset.reactTransitionPrintDialog = "enabled";
    createRoot(printDialogModal).render(
      <StrictMode>
        <PrintDialogModal />
      </StrictMode>,
    );
  }

  const contractorEntryModal = document.querySelector<HTMLElement>("[data-contractor-entry-root] .modal");
  if (contractorEntryModal) {
    document.body.dataset.reactTransitionContractorEntry = "enabled";
    createRoot(contractorEntryModal).render(
      <StrictMode>
        <ContractorEntryModal />
      </StrictMode>,
    );
  }

  const contractorDialogHost = document.createElement("div");
  contractorDialogHost.id = "react-contractor-dialog-root";
  document.body.appendChild(contractorDialogHost);
  document.body.dataset.reactTransitionContractorDialog = "enabled";
  createRoot(contractorDialogHost).render(
    <StrictMode>
      <ContractorDialogModal />
    </StrictMode>,
  );

  const contractorImportMappingHost = document.createElement("div");
  contractorImportMappingHost.id = "react-contractor-import-mapping-root";
  document.body.appendChild(contractorImportMappingHost);
  document.body.dataset.reactTransitionContractorImportMapping = "enabled";
  createRoot(contractorImportMappingHost).render(
    <StrictMode>
      <ContractorImportMappingModal />
    </StrictMode>,
  );

  const contractorImportReviewHost = document.createElement("div");
  contractorImportReviewHost.id = "react-contractor-import-review-root";
  document.body.appendChild(contractorImportReviewHost);
  document.body.dataset.reactTransitionContractorImportReview = "enabled";
  createRoot(contractorImportReviewHost).render(
    <StrictMode>
      <ContractorImportReviewModal />
    </StrictMode>,
  );

  const financeFilters = document.getElementById("fin-filters");
  if (financeFilters) {
    document.body.dataset.reactTransitionFinanceSurface = "enabled";
    createRoot(financeFilters).render(
      <StrictMode>
        <FinanceFiltersShell />
      </StrictMode>,
    );
  }

  const financeSummary = document.getElementById("fin-summary");
  if (financeSummary) {
    createRoot(financeSummary).render(
      <StrictMode>
        <FinanceSummaryShell />
      </StrictMode>,
    );
  }

  const financeTable = document.getElementById("fin-tbl");
  if (financeTable) {
    createRoot(financeTable).render(
      <StrictMode>
        <FinanceTableShell />
      </StrictMode>,
    );
  }
}

function mountReactRoots() {
  mountReactHost();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountReactRoots, { once: true });
} else {
  mountReactRoots();
}
