import { ReviewStoreSchema, type ReviewStore } from "../../../shared/schemas";
const KEY = "sofer.review.v1";
export const emptyReviewStore = (): ReviewStore => ({ schemaVersion: 1, records: {} });
export function readReviewStore(): ReviewStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyReviewStore();
    const parsed = ReviewStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyReviewStore();
  } catch { return emptyReviewStore(); }
}
export function writeReviewStore(store: ReviewStore): boolean {
  const parsed = ReviewStoreSchema.safeParse(store);
  if (!parsed.success) return false;
  try { localStorage.setItem(KEY, JSON.stringify(parsed.data)); return true; }
  catch { return false; }
}
export function clearReviewStore(): void {
  try { localStorage.removeItem(KEY); } catch { /* Storage may be unavailable. */ }
}
