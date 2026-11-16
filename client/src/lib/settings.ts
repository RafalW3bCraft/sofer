import { z } from "zod";
import { InferenceModeSchema, type InferenceModeValue } from "../../../shared/schemas";

const SettingsSchema = z.object({
  showTransliteration: z.boolean(),
  audioEnabled: z.boolean(),
  inferenceMode: InferenceModeSchema,
});

export type LearnerSettings = z.infer<typeof SettingsSchema>;
const KEY = "sofer.settings.v1";

export const DEFAULT_SETTINGS: LearnerSettings = {
  showTransliteration: false,
  audioEnabled: true,
  inferenceMode: "prefer_on_device",
};

export function readSettings(): LearnerSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = SettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(patch: Partial<LearnerSettings>): LearnerSettings {
  const next = { ...readSettings(), ...patch };
  const parsed = SettingsSchema.safeParse(next);
  if (!parsed.success) return readSettings();
  try {
    localStorage.setItem(KEY, JSON.stringify(parsed.data));
  } catch {
    // The current session still receives the preference if storage is full.
  }
  return parsed.data;
}

export function isInferenceMode(value: string): value is InferenceModeValue {
  return InferenceModeSchema.safeParse(value).success;
}
