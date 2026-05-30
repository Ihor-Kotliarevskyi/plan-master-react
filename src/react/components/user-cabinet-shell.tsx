import { useEffect, useState } from "react";
import {
  clearUserCabinetAvatar,
  clearUserCabinetBaseline,
  closeUserCabinetModal,
  logoutUserCabinet,
  openUserCabinetAuditLog,
  readUserCabinetSnapshot,
  saveUserCabinetBaseline,
  saveUserCabinetProfile,
  setUserCabinetAuthTab,
  subscribeUserCabinetSync,
  submitUserCabinetAuth,
  toggleUserCabinetBaseline,
  toggleUserCabinetTheme,
  uploadUserCabinetAvatar,
} from "../bridge/user-cabinet";
import type { UserCabinetSnapshot } from "../types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function UserCabinetShell() {
  const [snapshot, setSnapshot] = useState<UserCabinetSnapshot>(() => readUserCabinetSnapshot());
  const [profileName, setProfileName] = useState(snapshot.profile.name);
  const [defaults, setDefaults] = useState(snapshot.profile.defaults);
  const [authValues, setAuthValues] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState("");
  const [pending, setPending] = useState<"profile" | "auth" | "logout" | null>(null);

  useEffect(() => {
    const sync = () => setSnapshot(readUserCabinetSnapshot());
    sync();
    return subscribeUserCabinetSync(sync);
  }, []);

  useEffect(() => {
    setProfileName(snapshot.profile.name);
    setDefaults(snapshot.profile.defaults);
    setAuthError("");
    setAuthValues((state) => ({
      ...state,
      name: snapshot.profile.name || state.name,
    }));
  }, [snapshot.capturedAt, snapshot.profile.name, snapshot.profile.defaults]);

  async function handleProfileSave() {
    setPending("profile");
    await saveUserCabinetProfile({
      name: profileName,
      defaults,
    });
    setPending(null);
  }

  async function handleAuthSubmit() {
    setPending("auth");
    const result = await submitUserCabinetAuth({
      tab: snapshot.activeAuthTab,
      email: authValues.email,
      password: authValues.password,
      name: authValues.name || profileName,
    });
    setPending(null);
    if (result?.ok) {
      setAuthError("");
      setAuthValues({ email: "", password: "", name: authValues.name });
      return;
    }
    setAuthError(result?.error || "Authentication failed");
  }

  async function handleLogout() {
    setPending("logout");
    await logoutUserCabinet();
    setPending(null);
  }

  if (!snapshot.visible) return null;

  return (
    <div className="react-user-cabinet">
      <div className="um-cols">
        <div className="um-col">
          <div className="settings-section">
            <div className="settings-section-title">{snapshot.defaultsPanel.sectionTitle}</div>
            <div className="settings-section-body">
              <div className="setting-row">
                <label>{snapshot.defaultsPanel.startMonthLabel}</label>
                <select
                  value={defaults.sm}
                  onChange={(event) => setDefaults((state) => ({ ...state, sm: Number(event.target.value) }))}
                >
                  {MONTH_LABELS.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-row">
                <label>{snapshot.defaultsPanel.startYearLabel}</label>
                <input
                  type="number"
                  value={defaults.sy}
                  min={2020}
                  max={2040}
                  onChange={(event) => setDefaults((state) => ({ ...state, sy: Number(event.target.value) }))}
                />
              </div>
              <div className="setting-row">
                <label>{snapshot.defaultsPanel.durationLabel}</label>
                <input
                  type="number"
                  value={defaults.nm}
                  min={3}
                  max={120}
                  onChange={(event) => setDefaults((state) => ({ ...state, nm: Number(event.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{snapshot.themePanel.sectionTitle}</div>
            <div className="settings-section-body">
              <div className="setting-row">
                <label>{snapshot.themePanel.themeLabel}</label>
                <button className="theme-toggle react-user-cabinet__theme-btn" onClick={toggleUserCabinetTheme} type="button">
                  <span className="theme-label">{snapshot.identity.themeToggle.label}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{snapshot.baselinePanel.sectionTitle}</div>
            <div className="settings-section-body">
              {snapshot.baselinePanel.hasBaseline ? (
                <>
                  <div className="setting-row">
                    <label className="baseline-saved-lbl">{snapshot.baselinePanel.savedLabel}</label>
                    <button
                      className={`btn btn-sm btn-tog${snapshot.baselinePanel.showBaseline ? " on" : ""}`}
                      onClick={toggleUserCabinetBaseline}
                      type="button"
                    >
                      {snapshot.baselinePanel.toggleLabel}
                    </button>
                  </div>
                  <div className="baseline-actions">
                    <button className="btn btn-sm" onClick={saveUserCabinetBaseline} type="button">
                      {snapshot.baselinePanel.saveActionLabel}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={clearUserCabinetBaseline} type="button">
                      {snapshot.baselinePanel.deleteActionLabel}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="baseline-empty-hint">{snapshot.baselinePanel.emptyHint}</div>
                  <button className="btn btn-acc btn-sm" onClick={saveUserCabinetBaseline} type="button">
                    {snapshot.baselinePanel.saveActionLabel}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="um-col">
          <div className="um-user-card">
            <div className="user-avatar-large" id="um-avatar-preview">
              {snapshot.identity.avatarUrl ? (
                <img src={snapshot.identity.avatarUrl} alt="avatar" className="user-avatar-large-img" />
              ) : (
                <span id="um-avatar-initial">{(profileName || snapshot.identity.initial || "?")[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="um-user-info">
              <label htmlFor="react-um-name" className="user-inline-label">Ім'я</label>
              <input
                id="react-um-name"
                className="user-inline-input"
                value={profileName}
                placeholder="Введіть ім'я"
                onChange={(event) => setProfileName(event.target.value)}
              />
              <span className="user-email-hint">{snapshot.profile.email || "email не вказано"}</span>
              <div className="user-avatar-actions">
                <label className="avatar-upload-btn">
                  Фото
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(event) => uploadUserCabinetAvatar(event.target.files?.[0] || null)}
                  />
                </label>
                {snapshot.profile.avatar ? (
                  <button className="avatar-clear-btn" onClick={clearUserCabinetAvatar} type="button">
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{snapshot.accountSection.sectionTitle}</div>
            <div className="settings-section-body">
              {snapshot.loggedIn ? (
                <>
                  <div className="setting-row">
                    <label>{snapshot.accountSection.emailLabel}</label>
                    <span className="account-email">{snapshot.profile.email}</span>
                  </div>
                  <div className="setting-row react-user-cabinet__sync-row">
                    <label className="sync-enabled-lbl">{snapshot.syncBadge.label}</label>
                    <button className="btn btn-sm btn-danger" onClick={handleLogout} type="button">
                      {snapshot.accountSection.logoutLabel}
                    </button>
                  </div>
                  {snapshot.canViewAuditLog ? (
                    <div className="account-actions">
                      <button className="btn btn-sm" onClick={openUserCabinetAuditLog} type="button">
                        {snapshot.accountSection.auditLogLabel}
                      </button>
                    </div>
                  ) : null}
                  <div className="account-sync-details">
                    <div><b>{snapshot.accountSection.projectLabel}:</b> {snapshot.syncPanel.projectName}</div>
                    <div><b>{snapshot.accountSection.roleLabel}:</b> {snapshot.syncPanel.roleLabel}</div>
                    <div><b>{snapshot.accountSection.cloudCopyLabel}:</b> {snapshot.syncPanel.hasServerCopyText}</div>
                    <div><b>{snapshot.accountSection.localVersionLabel}:</b> {snapshot.syncPanel.localVersionText}</div>
                    <div><b>{snapshot.accountSection.serverVersionLabel}:</b> {snapshot.syncPanel.serverVersionText}</div>
                  </div>
                  {snapshot.syncPanel.updatedAtText ? (
                    <div className="account-sync-meta">
                      {snapshot.accountSection.lastLocalChangeLabel}: {new Date(snapshot.syncPanel.updatedAtText).toLocaleString("uk-UA")}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="auth-hint">{snapshot.authFormModel.hintText}</p>
                  <div className="auth-tabs">
                    <button
                      className={`btn btn-sm${snapshot.activeAuthTab === "login" ? " btn-acc" : ""}`}
                      onClick={() => setUserCabinetAuthTab("login")}
                      style={{ flex: 1 }}
                      type="button"
                    >
                      {snapshot.authFormModel.loginTabLabel}
                    </button>
                    <button
                      className={`btn btn-sm${snapshot.activeAuthTab === "register" ? " btn-acc" : ""}`}
                      onClick={() => setUserCabinetAuthTab("register")}
                      style={{ flex: 1 }}
                      type="button"
                    >
                      {snapshot.authFormModel.registerTabLabel}
                    </button>
                  </div>
                  <div className="auth-form auth-form-scroll">
                    {!snapshot.authFormModel.isLogin ? (
                      <div className="fg">
                        <label>{snapshot.authFormModel.nameLabel}</label>
                        <input
                          value={authValues.name}
                          placeholder={snapshot.authFormModel.namePlaceholder}
                          onChange={(event) => setAuthValues((state) => ({ ...state, name: event.target.value }))}
                        />
                      </div>
                    ) : null}
                    <div className="fg">
                      <label>{snapshot.authFormModel.emailLabel}</label>
                      <input
                        type="email"
                        value={authValues.email}
                        placeholder={snapshot.authFormModel.emailPlaceholder}
                        onChange={(event) => setAuthValues((state) => ({ ...state, email: event.target.value }))}
                      />
                    </div>
                    <div className="fg">
                      <label>{snapshot.authFormModel.passwordLabel}</label>
                      <input
                        type="password"
                        value={authValues.password}
                        placeholder={snapshot.authFormModel.passwordPlaceholder}
                        onChange={(event) => setAuthValues((state) => ({ ...state, password: event.target.value }))}
                      />
                    </div>
                    {authError ? <div className="auth-error react-user-cabinet__auth-error">{authError}</div> : null}
                    <button className="btn btn-acc auth-submit-btn" onClick={handleAuthSubmit} type="button">
                      {snapshot.authFormModel.submitLabel}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="react-user-cabinet__footer">
            <button className="btn" onClick={closeUserCabinetModal} type="button">Скасувати</button>
            <button className="btn btn-acc" onClick={handleProfileSave} disabled={pending === "profile" || !snapshot.loggedIn && pending === "auth"} type="button">
              {pending === "profile" ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </div>
      </div>
      {pending === "logout" || pending === "auth" ? (
        <div className="react-user-cabinet__status">
          {pending === "logout" ? "Signing out..." : "Processing authentication..."}
        </div>
      ) : null}
    </div>
  );
}
