let showBaseline = false;

function _getBaselineSavedToastModel() {
  if (typeof buildRuntimeBaselineSavedToastModel === "function") {
    return buildRuntimeBaselineSavedToastModel(proj.baselineDate);
  }
  return { title: `Базовий план збережено (${proj.baselineDate})` };
}

function _getBaselineClearDialogModel() {
  if (typeof buildRuntimeBaselineClearDialogModel === "function") {
    return buildRuntimeBaselineClearDialogModel();
  }
  return {
    title: "Очистити базовий план?",
    text: "Ghost-бари зникнуть. Відновити буде неможливо.",
    confirmButtonText: "Очистити",
    cancelButtonText: "Скасувати",
  };
}

function _getBaselineMissingModel() {
  if (typeof buildRuntimeBaselineMissingModel === "function") {
    return buildRuntimeBaselineMissingModel();
  }
  return {
    title: "Базовий план не збережено",
    text: "Натисніть «Зберегти базовий план» щоб зафіксувати поточний стан.",
  };
}

/** Зберігає поточні позиції задач як базовий план. */
async function saveBaseline() {
  proj.baseline = tasks.map((t) => ({ id: t.id, n: t.n, ms: t.ms, ws: t.ws, me: t.me, we: t.we }));
  proj.baselineDate = new Date().toLocaleDateString("uk-UA");
  saveAll();
  renderTable();
  await logProjectMutation(AUDIT_EVENT_TYPES.PROJECT_BASELINE_SAVED, {
    items: proj.baseline.length,
    baselineDate: proj.baselineDate,
  });
  const toastModel = _getBaselineSavedToastModel();
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: toastModel.title,
    showConfirmButton: false,
    timer: 3000,
  });
}

/** Очищає базовий план. */
async function clearBaseline() {
  const dialogModel = _getBaselineClearDialogModel();
  const res = await Swal.fire({
    icon: "warning",
    title: dialogModel.title,
    text: dialogModel.text,
    showCancelButton: true,
    confirmButtonText: dialogModel.confirmButtonText,
    confirmButtonColor: "#c42b2b",
    cancelButtonText: dialogModel.cancelButtonText,
  });
  if (!res.isConfirmed) return;
  proj.baseline = null;
  proj.baselineDate = null;
  showBaseline = false;
  saveAll();
  renderTable();
  document.getElementById("btn-baseline")?.classList.remove("on");
  await logProjectMutation(AUDIT_EVENT_TYPES.PROJECT_BASELINE_CLEARED);
}

/** Перемикає відображення базового плану. */
function toggleBaseline() {
  if (!proj.baseline) {
    const missingModel = _getBaselineMissingModel();
    Swal.fire({
      icon: "info",
      title: missingModel.title,
      text: missingModel.text,
    });
    return;
  }
  showBaseline = !showBaseline;
  document.getElementById("btn-baseline")?.classList.toggle("on", showBaseline);
  renderTable();
}

/** Повертає базову позицію для задачі за її id, або null. */
function getBaselinePos(id) {
  if (!proj.baseline || !showBaseline) return null;
  // Підтримка старих бейзлайнів (без id) через n як рядок
  return proj.baseline.find((b) => b.id === id || String(b.n) === String(id)) || null;
}
