export interface ApiUiModel {
  sessionExpiredTitle: string;
  share: {
    accessDeniedTitle: string;
    emptyText: string;
    modalTitle: string;
    projectLabel: string;
    grantSectionTitle: string;
    confirmButtonText: string;
    cancelButtonText: string;
    emailRequiredMessage: string;
  };
  auth: {
    loginTabLabel: string;
    registerTabLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginSubmitLabel: string;
    registerSubmitLabel: string;
    nameRequiredMessage: string;
    loginSuccessTitle: (name: string) => string;
    authErrorFallback: string;
    syncedTitle: string;
    syncedLogoutPromptTitle: string;
    syncedLogoutPromptText: string;
    logoutConfirmButtonText: string;
    loginButtonLabel: string;
  };
}

export interface FallbackAuthModalRenderModel {
  isLogin: boolean;
  loginTabClassName: string;
  registerTabClassName: string;
  submitLabel: string;
  showNameField: boolean;
}

export interface FallbackAuthButtonModel {
  text: string;
  title: string;
  mode: "login" | "logout";
}

export function buildApiUiModel(): ApiUiModel {
  return {
    sessionExpiredTitle: "Сесія закінчилась — увійдіть знову",
    share: {
      accessDeniedTitle: "У вас немає прав на керування доступом",
      emptyText: "Нікому не надано доступ",
      modalTitle: "👥 Спільний доступ",
      projectLabel: "Проєкт",
      grantSectionTitle: "Надати доступ:",
      confirmButtonText: "Надати доступ",
      cancelButtonText: "Закрити",
      emailRequiredMessage: "Введіть email",
    },
    auth: {
      loginTabLabel: "Увійти",
      registerTabLabel: "Реєстрація",
      nameLabel: "Ім'я",
      namePlaceholder: "Ваше ім'я",
      passwordLabel: "Пароль",
      passwordPlaceholder: "Мінімум 6 символів",
      loginSubmitLabel: "Увійти",
      registerSubmitLabel: "Зареєструватись",
      nameRequiredMessage: "Введіть ім'я",
      loginSuccessTitle: (name: string) => `Вітаємо, ${name}! ☁ Синхронізацію увімкнено`,
      authErrorFallback: "Помилка авторизації",
      syncedTitle: "Синхронізовано. Клік — вийти",
      syncedLogoutPromptTitle: "Вийти?",
      syncedLogoutPromptText: "Дані залишаться в браузері.",
      logoutConfirmButtonText: "Вийти",
      loginButtonLabel: "☁ Увійти",
    },
  };
}

export function buildFallbackAuthModalRenderModel(tab: string, ui: ApiUiModel["auth"]): FallbackAuthModalRenderModel {
  const isLogin = tab === "login";
  return {
    isLogin,
    loginTabClassName: `auth-tab${isLogin ? " active" : ""}`,
    registerTabClassName: `auth-tab${!isLogin ? " active" : ""}`,
    submitLabel: isLogin ? ui.loginSubmitLabel : ui.registerSubmitLabel,
    showNameField: !isLogin,
  };
}

export function buildFallbackAuthButtonModel(
  isLoggedIn: boolean,
  userName: string | null | undefined,
  ui: ApiUiModel["auth"],
): FallbackAuthButtonModel {
  if (isLoggedIn && userName) {
    return {
      text: `☃ ${userName}`,
      title: ui.syncedTitle,
      mode: "logout",
    };
  }
  return {
    text: ui.loginButtonLabel,
    title: "",
    mode: "login",
  };
}
