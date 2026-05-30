import { useEffect, useState } from "react";
import {
  closeShareModal,
  grantShare,
  readShareModalSnapshot,
  reloadShareModal,
  removeShare,
  subscribeShareModalSync,
  updateShareRole,
} from "../bridge/share-modal";
import type { ShareModalSnapshot } from "../types";

export function ShareModal() {
  const [snapshot, setSnapshot] = useState<ShareModalSnapshot>(() => readShareModalSnapshot());
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<null | string>(null);

  useEffect(() => {
    const sync = () => setSnapshot(readShareModalSnapshot());
    sync();
    return subscribeShareModalSync(sync);
  }, []);

  useEffect(() => {
    if (snapshot.roleOptions.length && !snapshot.roleOptions.some((item) => item.value === role)) {
      setRole(snapshot.roleOptions[0]?.value || "viewer");
    }
  }, [snapshot.roleOptions, role]);

  if (!snapshot.visible) return null;

  async function handleGrant() {
    setPending("grant");
    const result = await grantShare(email, role);
    setPending(null);
    if (result?.ok) {
      setEmail("");
      setFormError("");
      return;
    }
    setFormError(result?.error || snapshot.labels.emailRequiredMessage);
  }

  async function handleRoleChange(shareId: string, nextRole: string) {
    setPending(`role:${shareId}`);
    await updateShareRole(shareId, nextRole);
    setPending(null);
  }

  async function handleRemove(shareId: string) {
    setPending(`remove:${shareId}`);
    await removeShare(shareId);
    setPending(null);
  }

  return (
    <div className="react-share-overlay" onClick={closeShareModal} role="presentation">
      <div
        className="react-share-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={snapshot.labels.modalTitle}
      >
        <div className="react-share-modal__header">
          <h3>{snapshot.labels.modalTitle}</h3>
          <button className="btn btn-sm" onClick={closeShareModal} type="button">
            {snapshot.labels.cancelButtonText}
          </button>
        </div>

        <p className="share-proj-name">
          {snapshot.labels.projectLabel}: <b>{snapshot.projectName}</b>
        </p>

        {snapshot.loading ? <p className="react-share-modal__status">Loading…</p> : null}
        {!snapshot.loading && snapshot.error ? <p className="react-share-modal__error">{snapshot.error}</p> : null}

        {!snapshot.loading && !snapshot.error ? (
          <>
            <div className="share-list">
              {snapshot.items.length ? snapshot.items.map((item) => (
                <div className="share-row" key={item.id}>
                  <span>{item.displayLabel}</span>
                  <select
                    className="cost-sel"
                    defaultValue={item.normalizedRole}
                    onChange={(event) => void handleRoleChange(item.id, event.target.value)}
                  >
                    {snapshot.roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    className="cost-act-btn del"
                    onClick={() => void handleRemove(item.id)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              )) : <div className="share-empty">{snapshot.labels.emptyText}</div>}
            </div>

            <hr className="share-divider" />

            <div className="share-add-title">{snapshot.labels.grantSectionTitle}</div>
            <div className="share-add-row">
              <input
                type="email"
                placeholder={snapshot.labels.emailPlaceholder}
                className="share-email-inp"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <select className="share-role-sel" value={role} onChange={(event) => setRole(event.target.value)}>
                {snapshot.roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            {formError ? <div className="share-err">{formError}</div> : null}
            <div className="share-role-guide">
              {snapshot.labels.roleGuideItems.map((item) => (
                <div key={item.title}>
                  <b>{item.title}:</b> {item.description}
                </div>
              ))}
            </div>

            <div className="react-share-modal__footer">
              <button className="btn" onClick={() => void reloadShareModal()} type="button">
                Refresh
              </button>
              <button className="btn btn-acc" disabled={pending === "grant"} onClick={() => void handleGrant()} type="button">
                {snapshot.labels.confirmButtonText}
              </button>
            </div>
          </>
        ) : null}

        {pending && pending !== "grant" ? (
          <div className="react-share-modal__status">Updating access…</div>
        ) : null}
      </div>
    </div>
  );
}
