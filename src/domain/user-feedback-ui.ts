export interface AuthFlowMessages {
  nameRequired: string;
  loginSuccessTitle: string;
  localDataFoundTitle: string;
  localProjectIntro: string;
  modifiedLabel: string;
  localDataQuestion: string;
  loadCloudConfirmLabel: string;
  saveLocalToCloudLabel: string;
  projectsBootstrapWarningTitle: string;
  projectsBootstrapWarningText: string;
  syncEnabledTitle: string;
}

export interface ProfileFeedbackMessages {
  profileSavedTitle: string;
  avatarTooLargeTitle: string;
  avatarTooLargeText: string;
}

export function buildAuthFlowMessages(): AuthFlowMessages {
  return {
    nameRequired: "Введіть ім'я",
    loginSuccessTitle: "Вхід виконано",
    localDataFoundTitle: "Знайдено локальні дані",
    localProjectIntro: "Ви працювали без акаунту. Знайдено локальний проєкт:",
    modifiedLabel: "Змінено",
    localDataQuestion: "Що зробити з локальними даними?",
    loadCloudConfirmLabel: "☁ Завантажити з хмари",
    saveLocalToCloudLabel: "📱 Зберегти локальні в хмару",
    projectsBootstrapWarningTitle: "Вхід виконано, але проєкти не завантажились",
    projectsBootstrapWarningText: "Перевірте стан бази даних і спробуйте оновити сторінку",
    syncEnabledTitle: "Вітаємо! ☁ Синхронізацію увімкнено",
  };
}

export function buildProfileFeedbackMessages(): ProfileFeedbackMessages {
  return {
    profileSavedTitle: "Профіль збережено",
    avatarTooLargeTitle: "Файл завеликий",
    avatarTooLargeText: "Максимум 2 МБ.",
  };
}
