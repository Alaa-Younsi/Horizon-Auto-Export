import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Class join with Tailwind conflict resolution (a later `w-20` beats an earlier `w-full`). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
