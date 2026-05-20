export interface UserIdentityInput {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  theme?: string | null;
}

export interface ThemeToggleModel {
  theme: "light" | "dark";
  icon: "moon" | "sun";
  label: string;
}

export interface UserIdentityModel {
  displayName: string;
  emailText: string;
  initial: string;
  avatarUrl: string | null;
  themeToggle: ThemeToggleModel;
}

export function buildThemeToggleModel(theme?: string | null): ThemeToggleModel {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  return {
    theme: normalizedTheme,
    icon: normalizedTheme === "dark" ? "sun" : "moon",
    label: normalizedTheme === "dark" ? "Light" : "Dark",
  };
}

export function buildUserIdentityModel(
  input: UserIdentityInput,
  fallbackName = "Profile",
): UserIdentityModel {
  const displayName = (input.name || "").trim() || fallbackName;
  const emailText = (input.email || "").trim();
  return {
    displayName,
    emailText,
    initial: (displayName || "?")[0]!.toUpperCase(),
    avatarUrl: input.avatar || null,
    themeToggle: buildThemeToggleModel(input.theme),
  };
}
