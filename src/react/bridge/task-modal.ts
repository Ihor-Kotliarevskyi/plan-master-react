import { z } from "zod";
import type { TaskModalSnapshot } from "../types";

const snapshotSchema: z.ZodType<TaskModalSnapshot> = z.object({
  visible: z.boolean(),
  activeTab: z.string(),
  canEdit: z.boolean(),
  title: z.string(),
  form: z.object({
    name: z.string(),
    budget: z.string(),
    spent: z.string(),
    contractsOverrideBudget: z.boolean(),
  }),
  autoBadges: z.object({
    budget: z.boolean(),
    spent: z.boolean(),
  }),
  sections: z.object({
    categoryHtml: z.string(),
    phasesHtml: z.string(),
    dependencyTagsHtml: z.string(),
    dependencyDropdownHtml: z.string(),
    dependencyDropdownVisible: z.boolean(),
    dependencyEditorHtml: z.string(),
    dependencyEditorVisible: z.boolean(),
    dependencyWarningHtml: z.string(),
    dependencyWarningVisible: z.boolean(),
    calcInfoHtml: z.string(),
    networkHtml: z.string(),
    networkVisible: z.boolean(),
    costTableHtml: z.string(),
    costFooterHtml: z.string(),
  }),
  labels: z.object({
    generalTab: z.string(),
    costsTab: z.string(),
    nameLabel: z.string(),
    namePlaceholder: z.string(),
    categoryLabel: z.string(),
    phasesLabel: z.string(),
    addPhaseButton: z.string(),
    dependenciesLabel: z.string(),
    budgetLabel: z.string(),
    budgetAutoLabel: z.string(),
    contractsOverrideBudgetLabel: z.string(),
    spentLabel: z.string(),
    spentAutoLabel: z.string(),
    networkLabel: z.string(),
    costTypeMaterial: z.string(),
    costTypeWork: z.string(),
    costTypeEquipment: z.string(),
    costTypeService: z.string(),
    costTypeOther: z.string(),
    cancelButton: z.string(),
    saveButton: z.string(),
    tableTypeHeader: z.string(),
    tableContractHeader: z.string(),
    tableSupplierHeader: z.string(),
    tableBudgetHeader: z.string(),
    tableNoteHeader: z.string(),
    tableTotalHeader: z.string(),
  }),
  capturedAt: z.string(),
});

type TaskModalWindow = Window & {
  getTaskModalBridgeSnapshot?: () => unknown;
  closeModal?: () => void;
  saveTask?: () => Promise<void> | void;
  switchTaskTab?: (tab: string) => void;
  modalAddPhase?: () => void;
  modalRemovePhase?: (phaseIndex: number) => void;
  onModalPhaseChange?: () => void;
  onModalProgChange?: (phaseIndex: number, value: string) => void;
  adjNum?: (id: string, delta: number) => void;
  filterDepSearch?: (query: string) => void;
  showDepDropdown?: () => void;
  addDepTag?: (id: string) => void;
  removeDepTag?: (id: string) => void;
  editDepTag?: (id: string) => void;
  setDepType?: (id: string, type: string) => void;
  setDepThreshold?: (id: string, value: string | number) => void;
  adjDepThr?: (id: string, delta: number) => void;
  pickCat?: (index: number) => void;
  updCalc?: () => void;
  addCostItem?: (type: string) => void;
  setCostField?: (id: number, field: string, value: string | number) => void;
  setCostContractNo?: (id: number, value: string) => void;
  toggleCostPayments?: (id: number) => void;
  deleteCostItem?: (id: number) => void;
  addPayment?: (itemId: number) => void;
  setPayField?: (itemId: number, paymentIndex: number, field: string, value: string | number) => void;
  deletePayment?: (itemId: number, paymentIndex: number) => void;
  _recalcRow?: (id: number) => void;
  _refreshTotals?: () => void;
};

function getTaskModalWindow(): TaskModalWindow {
  return window as TaskModalWindow;
}

function buildFallbackSnapshot(): TaskModalSnapshot {
  return {
    visible: false,
    activeTab: "general",
    canEdit: true,
    title: "Нова робота",
    form: {
      name: "",
      budget: "",
      spent: "",
      contractsOverrideBudget: false,
    },
    autoBadges: {
      budget: false,
      spent: false,
    },
    sections: {
      categoryHtml: "",
      phasesHtml: "",
      dependencyTagsHtml: "",
      dependencyDropdownHtml: "",
      dependencyDropdownVisible: false,
      dependencyEditorHtml: "",
      dependencyEditorVisible: false,
      dependencyWarningHtml: "",
      dependencyWarningVisible: false,
      calcInfoHtml: "",
      networkHtml: "",
      networkVisible: false,
      costTableHtml: "",
      costFooterHtml: "",
    },
    labels: {
      generalTab: "Загальне",
      costsTab: "Кошторис",
      nameLabel: "Назва",
      namePlaceholder: "Введіть назву...",
      categoryLabel: "Категорія",
      phasesLabel: "Фази та терміни",
      addPhaseButton: "+ Фаза",
      dependenciesLabel: "Залежить від",
      budgetLabel: "Вартість (грн)",
      budgetAutoLabel: "авто",
      contractsOverrideBudgetLabel: "Договори формують суму роботи",
      spentLabel: "Витрачено (грн)",
      spentAutoLabel: "авто",
      networkLabel: "Граф залежностей",
      costTypeMaterial: "Матеріали",
      costTypeWork: "Роботи",
      costTypeEquipment: "Техніка",
      costTypeService: "Послуги",
      costTypeOther: "Інше",
      cancelButton: "Скасувати",
      saveButton: "Зберегти",
      tableTypeHeader: "Тип",
      tableContractHeader: "Номер договору",
      tableSupplierHeader: "Контрагент",
      tableBudgetHeader: "Вартість договору",
      tableNoteHeader: "Примітки",
      tableTotalHeader: "Сума / дії",
    },
    capturedAt: new Date().toISOString(),
  };
}

export function readTaskModalSnapshot(): TaskModalSnapshot {
  const parsed = snapshotSchema.safeParse(getTaskModalWindow().getTaskModalBridgeSnapshot?.());
  return parsed.success ? parsed.data : buildFallbackSnapshot();
}

export function subscribeTaskModalSync(onSync: () => void): () => void {
  const handler = () => onSync();
  document.addEventListener("plan-master:task-modal-sync", handler);
  return () => document.removeEventListener("plan-master:task-modal-sync", handler);
}

export function closeTaskModal(): void {
  getTaskModalWindow().closeModal?.();
}

export async function saveTaskModal(): Promise<void> {
  await Promise.resolve(getTaskModalWindow().saveTask?.());
}

export function switchTaskModalTab(tab: string): void {
  getTaskModalWindow().switchTaskTab?.(tab);
}

export function addTaskModalPhase(): void {
  getTaskModalWindow().modalAddPhase?.();
}

export function removeTaskModalPhase(phaseIndex: number): void {
  getTaskModalWindow().modalRemovePhase?.(phaseIndex);
}

export function notifyTaskModalPhaseChange(): void {
  getTaskModalWindow().onModalPhaseChange?.();
}

export function notifyTaskModalProgressChange(phaseIndex: number, value: string): void {
  getTaskModalWindow().onModalProgChange?.(phaseIndex, value);
}

export function adjustTaskModalNumber(id: string, delta: number): void {
  getTaskModalWindow().adjNum?.(id, delta);
}

export function filterTaskModalDependencies(query: string): void {
  getTaskModalWindow().filterDepSearch?.(query);
}

export function showTaskModalDependencyDropdown(): void {
  getTaskModalWindow().showDepDropdown?.();
}

export function addTaskModalDependency(id: string): void {
  getTaskModalWindow().addDepTag?.(id);
}

export function removeTaskModalDependency(id: string): void {
  getTaskModalWindow().removeDepTag?.(id);
}

export function editTaskModalDependency(id: string): void {
  getTaskModalWindow().editDepTag?.(id);
}

export function setTaskModalDependencyType(id: string, type: string): void {
  getTaskModalWindow().setDepType?.(id, type);
}

export function setTaskModalDependencyThreshold(id: string, value: string | number): void {
  getTaskModalWindow().setDepThreshold?.(id, value);
}

export function adjustTaskModalDependencyThreshold(id: string, delta: number): void {
  getTaskModalWindow().adjDepThr?.(id, delta);
}

export function pickTaskModalCategory(index: number): void {
  getTaskModalWindow().pickCat?.(index);
}

export function updateTaskModalCalc(): void {
  getTaskModalWindow().updCalc?.();
}

export function addTaskModalCostItem(type: string): void {
  getTaskModalWindow().addCostItem?.(type);
}

export function setTaskModalCostField(id: number, field: string, value: string | number): void {
  getTaskModalWindow().setCostField?.(id, field, value);
}

export function setTaskModalCostContractNo(id: number, value: string): void {
  getTaskModalWindow().setCostContractNo?.(id, value);
}

export function toggleTaskModalCostPayments(id: number): void {
  getTaskModalWindow().toggleCostPayments?.(id);
}

export function deleteTaskModalCostItem(id: number): void {
  getTaskModalWindow().deleteCostItem?.(id);
}

export function addTaskModalPayment(itemId: number): void {
  getTaskModalWindow().addPayment?.(itemId);
}

export function setTaskModalPaymentField(
  itemId: number,
  paymentIndex: number,
  field: string,
  value: string | number,
): void {
  getTaskModalWindow().setPayField?.(itemId, paymentIndex, field, value);
}

export function deleteTaskModalPayment(itemId: number, paymentIndex: number): void {
  getTaskModalWindow().deletePayment?.(itemId, paymentIndex);
}

export function recalcTaskModalCostRow(id: number): void {
  getTaskModalWindow()._recalcRow?.(id);
}

export function refreshTaskModalCostTotals(): void {
  getTaskModalWindow()._refreshTotals?.();
}
