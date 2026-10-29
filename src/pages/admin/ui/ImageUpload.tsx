import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { type UploadFolder, uploadImage } from "@/lib/image";
import { useAdminT } from "../i18n/AdminI18n";
import { useToast } from "./Toast";

/**
 * Picks, compresses (WebP) and uploads one image; the URL only reaches the
 * database when the surrounding form is saved.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  hint,
  wide,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: UploadFolder;
  label: string;
  hint?: string;
  /** Landscape preview (hero images) instead of a square. */
  wide?: boolean;
}) {
  const { t } = useAdminT();
  const toast = useToast();
  const id = useId();
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(file, folder));
    } catch {
      toast.error(t("uploadError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-navy-900">{label}</p>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-line",
            wide ? "aspect-[16/7] w-64" : "size-24",
          )}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="size-6 text-navy-900/25" aria-hidden />
          )}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label
            htmlFor={id}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-navy-900 ring-1 ring-line hover:bg-paper"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-4" aria-hidden />
            )}
            {busy ? t("uploading") : t("uploadImage")}
          </label>
          <input
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700"
            >
              <X className="size-3.5" aria-hidden />
              {t("removeImage")}
            </button>
          )}
          {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
