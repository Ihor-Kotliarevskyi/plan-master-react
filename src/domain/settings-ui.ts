export interface ProjectDefaultsPanelModel {
  sectionTitle: string;
  startMonthLabel: string;
  startYearLabel: string;
  durationLabel: string;
}

export interface ThemePanelModel {
  sectionTitle: string;
  themeLabel: string;
}

export function buildProjectDefaultsPanelModel(): ProjectDefaultsPanelModel {
  return {
    sectionTitle: "Project defaults",
    startMonthLabel: "Start month",
    startYearLabel: "Start year",
    durationLabel: "Duration (months)",
  };
}

export function buildThemePanelModel(): ThemePanelModel {
  return {
    sectionTitle: "Appearance",
    themeLabel: "Theme",
  };
}
