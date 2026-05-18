let showBaseline = false;

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
  Swal.fire({
    toast: true, position: "top-end", icon: "success",
    title: `Базовий план збережено (${proj.baselineDate})`,
    showConfirmButton: false, timer: 3000,
  });
}

/** Очищає базовий план. */
async function clearBaseline() {
  const res = await Swal.fire({
    icon: "warning", title: "Очистити базовий план?",
    text: "Ghost-бари зникнуть. Відновити буде неможливо.",
    showCancelButton: true,
    confirmButtonText: "Очистити", confirmButtonColor: "#c42b2b",
    cancelButtonText: "Скасувати",
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
    Swal.fire({
      icon: "info", title: "Базовий план не збережено",
      text: "Натисніть «Зберегти базовий план» щоб зафіксувати поточний стан.",
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
