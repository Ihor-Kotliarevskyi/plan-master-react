export type AuthTab = "login" | "register";

export interface AuthFormModel {
  tab: AuthTab;
  isLogin: boolean;
  hintText: string;
  loginTabLabel: string;
  registerTabLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  submitLabel: string;
}

export function buildAuthFormModel(tab: AuthTab): AuthFormModel {
  const isLogin = tab === "login";
  return {
    tab,
    isLogin,
    hintText: "Sign in to save projects in the cloud and access them from any device.",
    loginTabLabel: "Sign in",
    registerTabLabel: "Register",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "example@mail.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    submitLabel: isLogin ? "Sign in" : "Register",
  };
}

export function getAuthTabButtonClass(tab: AuthTab, activeTab: AuthTab): string {
  return "btn btn-sm" + (tab === activeTab ? " btn-acc" : "");
}
