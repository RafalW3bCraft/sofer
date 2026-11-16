import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  connectAuthEmulator,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { firebaseApp, initializeSoferAppCheck } from "./config";

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
if (
  firebaseAuth &&
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true"
) {
  connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });
} else if (firebaseAuth) {
  initializeSoferAppCheck();
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(firebaseAuth));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(
      firebaseAuth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        setError(null);
      },
      () => {
        setLoading(false);
        setError("Could not read the Firebase sign-in state.");
      },
    );
  }, []);

  return { user, loading, error };
}

export async function createSoferAccount(email: string, password: string): Promise<void> {
  if (!firebaseAuth) throw new Error("Firebase Auth is not configured.");
  await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function signInToSofer(email: string, password: string): Promise<void> {
  if (!firebaseAuth) throw new Error("Firebase Auth is not configured.");
  await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function signOutOfSofer(): Promise<void> {
  if (!firebaseAuth) return;
  await signOut(firebaseAuth);
}
