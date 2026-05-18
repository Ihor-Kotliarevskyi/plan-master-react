/** Обгортка: блокує виклик функції, якщо поточна роль не має потрібної capability. */
function _guardCapability(fn, label = "редагування", capability = "canEditTasks") {
  return async function (...args) {
    const allowed = typeof window[capability] === "function" ? window[capability]() : true;
    if (!allowed) {
      Swal.fire({
        toast: true, position: "top-end", icon: "warning",
        title: `У вас немає прав на ${label}`,
        text: "Зверніться до власника проєкту щоб отримати доступ.",
        showConfirmButton: false, timer: 3500,
      });
      return;
    }
    return fn.apply(this, args);
  };
}

window.addEventListener("load", () => {
  if (typeof canEditTasks !== "function") return;

  const guarded = {
    openAdd: { label: "створення задачі", capability: "canEditTasks" },
    saveTask: { label: "збереження задачі", capability: "canEditTasks" },
    delTask: { label: "видалення задачі", capability: "canEditTasks" },
    saveProjSettings: { label: "зміну налаштувань", capability: "canManageProject" },
    saveCats: { label: "зміну категорій", capability: "canManageProject" },
    saveBaseline: { label: "збереження базового плану", capability: "canEditTasks" },
    clearBaseline: { label: "видалення базового плану", capability: "canEditTasks" },
    savePhases: { label: "збереження фаз", capability: "canEditTasks" },
    saveCostModal: { label: "збереження кошторису", capability: "canEditTasks" },
    deleteProject: { label: "видалення проєкту", capability: "canManageProject" },
    importJSON: { label: "імпорт", capability: "canEditTasks" },
    importContractorTable: { label: "імпорт оплат", capability: "canEditTasks" },
    saveContractorEntry: { label: "додавання контрагентів та оплат", capability: "canEditTasks" },
    editContractor: { label: "редагування контрагентів", capability: "canEditTasks" },
    deleteContractor: { label: "видалення контрагентів", capability: "canEditTasks" },
    openContractorActModal: { label: "додавання актів", capability: "canEditTasks" },
    editContractorAct: { label: "редагування актів", capability: "canEditTasks" },
    deleteContractorAct: { label: "видалення актів", capability: "canEditTasks" },
    openContractorPaymentModal: { label: "додавання платежів", capability: "canEditTasks" },
    editContractorPayment: { label: "редагування платежів", capability: "canEditTasks" },
    deleteContractorPayment: { label: "видалення платежів", capability: "canEditTasks" },
    createPaymentRegisterFromFilters: { label: "створення реєстру платежів", capability: "canEditTasks" },
    deletePaymentRegister: { label: "видалення реєстру платежів", capability: "canEditTasks" },
  };

  Object.entries(guarded).forEach(([name, rule]) => {
    if (typeof window[name] === "function") {
      window[name] = _guardCapability(window[name], rule.label, rule.capability);
    }
  });
});
