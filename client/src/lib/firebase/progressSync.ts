import { connectFirestoreEmulator, deleteDoc, doc, getFirestore, runTransaction } from "firebase/firestore";
import {
  LearnerSyncStateSchema,
  type LearnerSyncState,
} from "../../../../shared/schemas";
import {
  emptyProgress,
  emptyTrickyTokens,
  readProgress,
  readTrickyTokens,
  writeProgress,
  writeTrickyTokens,
} from "../storage";
import { firebaseApp, initializeSoferAppCheck } from "./config";
import { mergeLearnerSyncState } from "./syncDomain";

let emulatorConnected = false;
function getFirestoreDb() {
  const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
  if (!firebaseApp || (!useEmulators && !initializeSoferAppCheck())) {
    throw new Error("Firebase is not configured for progress sync.");
  }
  const db = getFirestore(firebaseApp);
  if (useEmulators && !emulatorConnected) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    emulatorConnected = true;
  }
  return db;
}

export async function syncLocalProgress(uid: string, confirmed: boolean): Promise<LearnerSyncState> {
  if (!confirmed) throw new Error("Progress import requires explicit confirmation.");
  if (!uid) throw new Error("Sign in before syncing progress.");

  const progress = readProgress();
  const tricky = readTrickyTokens();
  const local: LearnerSyncState = {
    schemaVersion: 1,
    progress: progress.ok ? progress.value : emptyProgress(),
    trickyTokens: tricky.ok ? tricky.value : emptyTrickyTokens(),
    updatedAt: new Date().toISOString(),
  };
  const db = getFirestoreDb();
  const ref = doc(db, "users", uid, "state", "current");
  const merged = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const remote = snapshot.exists()
      ? LearnerSyncStateSchema.parse(snapshot.data())
      : null;
    const next = mergeLearnerSyncState(local, remote, new Date().toISOString());
    transaction.set(ref, next);
    return next;
  });

  if (!writeProgress(merged.progress) || !writeTrickyTokens(merged.trickyTokens)) {
    throw new Error("Cloud sync completed, but this browser could not update its local copy.");
  }
  return merged;
}

export async function deleteSyncedProgress(uid: string): Promise<void> {
  if (!uid) throw new Error("Sign in before deleting synced progress.");
  await deleteDoc(doc(getFirestoreDb(), "users", uid, "state", "current"));
}
