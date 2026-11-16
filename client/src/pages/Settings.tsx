import { useState } from "react";
import { useFirebaseAuth, createSoferAccount, signInToSofer, signOutOfSofer } from "../lib/firebase/auth";
import { clearProgress, emptyProgress, emptyTrickyTokens, readProgress, readTrickyTokens, writeProgress, writeTrickyTokens } from "../lib/storage";
import { DEFAULT_SETTINGS, readSettings, updateSettings, type LearnerSettings } from "../lib/settings";
import type { InferenceModeValue } from "../../../shared/schemas";
import { clearReviewStore, readReviewStore } from "../lib/reviewStorage";

export default function Settings() {
  const auth = useFirebaseAuth();
  const [settings, setSettings] = useState<LearnerSettings>(() => readSettings());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authAction, setAuthAction] = useState<"signin" | "create">("signin");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteCloud, setConfirmDeleteCloud] = useState(false);

  const changeSetting = (patch: Partial<LearnerSettings>) => {
    setSettings(updateSettings(patch));
  };

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (authAction === "create") await createSoferAccount(email, password);
      else await signInToSofer(email, password);
      setNotice(authAction === "create" ? "Your account is ready." : "You are signed in.");
      setPassword("");
    } catch {
      setError("Sign-in failed. Check the email and password, then try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!auth.user) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const { syncLocalProgress } = await import("../lib/firebase/progressSync");
      const merged = await syncLocalProgress(auth.user.uid, true);
      setNotice(`Progress synced. ${merged.progress.totalQuestionsAnswered} sentence answers are on this device and account.`);
    } catch {
      setError("Progress sync failed. Your local progress remains available.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCloudDelete() {
    if (!auth.user) return;
    setBusy(true);
    setError(null);
    try {
      const { deleteSyncedProgress } = await import("../lib/firebase/progressSync");
      await deleteSyncedProgress(auth.user.uid);
      setNotice("Synced learning data was deleted from this account.");
      setConfirmDeleteCloud(false);
    } catch {
      setError("Could not delete synced learning data.");
    } finally {
      setBusy(false);
    }
  }

  function exportProgress() {
    const progress = readProgress();
    const tricky = readTrickyTokens();
    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      progress: progress.ok ? progress.value : emptyProgress(),
      trickyTokens: tricky.ok ? tricky.value : emptyTrickyTokens(),
      review: readReviewStore(),
      settings,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sofer-learning-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetLocal() {
    writeProgress(emptyProgress());
    writeTrickyTokens(emptyTrickyTokens());
    clearProgress();
    clearReviewStore();
    setNotice("Local learning progress was reset.");
    setConfirmReset(false);
  }

  return (
    <section className="page settings-page">
      <h1>Settings</h1>
      <p>Choose how Sofer presents lessons and how your learning data is stored.</p>

      {notice && <p className="notice" role="status">{notice}</p>}
      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <section className="settings-card" aria-labelledby="learning-settings">
        <h2 id="learning-settings">Learning preferences</h2>
        <label className="settings-choice">
          <input type="checkbox" checked={settings.showTransliteration} onChange={(e) => changeSetting({ showTransliteration: e.target.checked })} />
          Show transliteration in lessons
        </label>
        <label className="settings-choice">
          <input type="checkbox" checked={settings.audioEnabled} onChange={(e) => changeSetting({ audioEnabled: e.target.checked })} />
          Enable pronunciation controls
        </label>
        <label>
          AI inference preference
          <select value={settings.inferenceMode} onChange={(e) => changeSetting({ inferenceMode: e.target.value as InferenceModeValue })}>
            <option value="prefer_on_device">Prefer on device, fall back to cloud</option>
            <option value="only_on_device">On device only</option>
            <option value="prefer_in_cloud">Prefer cloud, fall back to device</option>
            <option value="only_in_cloud">Cloud only</option>
          </select>
        </label>
        <p className="settings-help">AI questions send the selected lesson context to Firebase AI Logic. On-device use is reported only when Firebase reports that the response came from the device. The app does not save tutor conversations.</p>
        <button type="button" className="btn btn--ghost" onClick={() => setSettings(updateSettings(DEFAULT_SETTINGS))}>Reset preferences</button>
      </section>

      <section className="settings-card" aria-labelledby="account-settings">
        <h2 id="account-settings">Optional account and progress sync</h2>
        {auth.loading ? <p>Checking sign-in…</p> : auth.user ? (
          <>
            <p>Signed in as <strong>{auth.user.email}</strong>.</p>
            <p>Your progress stays local unless you choose to sync it.</p>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={handleSync}>Merge local progress with this account</button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => void signOutOfSofer()}>Sign out</button>
            {confirmDeleteCloud ? (
              <div className="settings-confirm">
                <p>This permanently deletes this account’s synced learning data. Local progress on this device is unchanged.</p>
                <button type="button" className="btn btn--danger" disabled={busy} onClick={() => void handleCloudDelete()}>Confirm delete synced data</button>
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmDeleteCloud(false)}>Cancel</button>
              </div>
            ) : <button type="button" className="btn btn--ghost" onClick={() => setConfirmDeleteCloud(true)}>Delete synced learning data</button>}
          </>
        ) : (
          <>
            <p>Learn as a guest without an account. Sign in only if you want to sync progress across devices.</p>
            <form className="settings-auth-form" onSubmit={(event) => void handleAuthSubmit(event)}>
              <label>Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              <label>Password<input type="password" autoComplete={authAction === "create" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              <div className="settings-actions">
                <button type="submit" className="btn btn--primary" disabled={busy || !import.meta.env.VITE_FIREBASE_API_KEY}>
                  {busy ? "Working…" : authAction === "create" ? "Create account" : "Sign in"}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setAuthAction(authAction === "create" ? "signin" : "create")}>
                  {authAction === "create" ? "I already have an account" : "Create an account"}
                </button>
              </div>
            </form>
          </>
        )}
        {!import.meta.env.VITE_FIREBASE_API_KEY && <p className="settings-help">Firebase is not configured in this build; guest learning still works.</p>}
      </section>

      <section className="settings-card" aria-labelledby="data-settings">
        <h2 id="data-settings">Your data</h2>
        <p>Learning progress is stored in this browser by default. Sync is opt-in and can be removed from your account here.</p>
        <div className="settings-actions">
          <button type="button" className="btn btn--ghost" onClick={exportProgress}>Export local learning data</button>
          {confirmReset ? (
            <>
              <button type="button" className="btn btn--danger" onClick={resetLocal}>Confirm reset local data</button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
            </>
          ) : <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>Reset local progress</button>}
        </div>
      </section>
    </section>
  );
}
