/** Обгортка: блокує виклик функції, якщо поточний користувач — viewer. */
function _guardEdit(fn, label = "редагування") {
  return async function (...args) {
    if (typeof isReadOnly === "function" && isReadOnly()) {
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
  if (typeof isReadOnly !== "function") return;

  const guarded = {
    openAdd: "створення задачі",
    saveTask: "збереження задачі",
    delTask: "видалення задачі",
    saveProjSettings: "зміну налаштувань",
    saveCats: "зміну категорій",
    saveBaseline: "збереження базового плану",
    clearBaseline: "видалення базового плану",
    savePhases: "збереження фаз",
    saveCostModal: "збереження кошторису",
    createProject: "створення проєкту",
    deleteProject: "видалення проєкту",
    importJSON: "імпорт",
    importContractorTable: "імпорт оплат",
    saveContractorEntry: "додавання контрагентів та оплат",
    editContractor: "редагування контрагентів",
    deleteContractor: "видалення контрагентів",
    openContractorActModal: "додавання актів",
    editContractorAct: "редагування актів",
    deleteContractorAct: "видалення актів",
    openContractorPaymentModal: "додавання платежів",
    editContractorPayment: "редагування платежів",
    deleteContractorPayment: "видалення платежів",
    createPaymentRegisterFromFilters: "створення реєстру платежів",
    deletePaymentRegister: "видалення реєстру платежів",
  };

  Object.entries(guarded).forEach(([name, label]) => {
    if (typeof window[name] === "function") {
      window[name] = _guardEdit(window[name], label);
    }
  });
});
