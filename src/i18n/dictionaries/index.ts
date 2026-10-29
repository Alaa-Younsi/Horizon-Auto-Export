import type { Lang } from "../languages";
import { en } from "./en";
import { fr } from "./fr";
import { type Dictionary, ro } from "./ro";

export const DICTIONARIES: Record<Lang, Dictionary> = { ro, en, fr };
export type { Dictionary, TranslationKey } from "./ro";
