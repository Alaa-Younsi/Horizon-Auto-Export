import { CircleAlert, Inbox, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Input, Textarea } from "@/components/ui/Field";
import { DEFAULT_LANG, LANG_META, type Lang, SITE_LANGS } from "@/i18n/languages";
import { cn } from "@/lib/cn";
import type { Localized } from "@/types/db";
import { useAdminT } from "../i18n/AdminI18n";
import type { AdminKey } from "../i18n/en";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-bold text-navy-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  actions,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl bg-white p-5 ring-1 ring-navy-900/6 sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-navy-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("grid min-h-40 place-items-center", className)}>
      <LoaderCircle className="size-7 animate-spin text-gold-500" aria-hidden />
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
      <Inbox className="mb-3 size-8 text-navy-900/25" aria-hidden />
      {text}
    </div>
  );
}

/** A failed LOAD blocks the screen — never fall through to an empty, saveable form. */
export function LoadError() {
  const { t } = useAdminT();
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-2xl bg-gold-50 p-5 text-sm font-medium text-navy-900 ring-1 ring-gold-300"
    >
      <CircleAlert className="size-5 shrink-0 text-gold-600" aria-hidden />
      {t("loadError")}
    </div>
  );
}

const BADGE_TONES = {
  gold: "bg-gold-100 text-gold-800 ring-gold-200",
  goldSolid: "bg-gold-500 text-white ring-gold-500",
  navy: "bg-navy-50 text-navy-800 ring-navy-100",
  navySolid: "bg-navy-900 text-white ring-navy-900",
  gray: "bg-paper text-muted ring-line",
} as const;
export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ children, tone = "gray" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex w-fit cursor-pointer items-center gap-3 text-sm font-medium text-navy-900",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300",
          checked ? "bg-gold-500" : "bg-navy-900/15",
        )}
      >
        <span
          className={cn(
            "absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-300",
            checked && "translate-x-5",
          )}
        />
      </button>
      {label}
    </label>
  );
}

/**
 * Accessible dialog. Escape and backdrop close it (unless `busy`), focus moves in
 * on open, and the page behind is scroll-locked with position:fixed.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  busy,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  size?: "md" | "lg";
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const { t } = useAdminT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const { body } = document;
    const y = window.scrollY;
    const prev = [body.style.position, body.style.top, body.style.width] as const;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    panel.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      [body.style.position, body.style.top, body.style.width] = prev;
      window.scrollTo(0, y);
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-navy-950/55 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        tabIndex={-1}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-2xl sm:rounded-[24px]",
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-navy-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="-m-2 rounded-full p-2 text-muted hover:bg-paper hover:text-navy-900"
            aria-label={t("close")}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-brand">{children}</div>
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  messageKey,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** One confirmation key per entity — never a shared generic one. */
  messageKey: AdminKey;
  busy?: boolean;
}) {
  const { t } = useAdminT();
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={t("confirmTitle")}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className={adminButton.secondary}>
            {t("cancel")}
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className={adminButton.primary}>
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {t("delete")}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
          <TriangleAlert className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-navy-900">{t(messageKey)}</p>
          <p className="mt-1 text-sm text-muted">{t("irreversible")}</p>
        </div>
      </div>
    </Modal>
  );
}

export function FormField({
  id,
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">
        {label}
        {required && <span className="ms-1 text-gold-600">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gold-700"
        >
          <CircleAlert className="size-3.5" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * All three languages at once (not a switcher): staff usually translate a line
 * they just rewrote and need to see the other versions while doing it. The
 * Romanian text is the placeholder of the others, so an empty translation reads
 * as "falls back to Romanian".
 */
export function LocalizedInput({
  id,
  label,
  value,
  onChange,
  multiline,
  required,
  error,
  hint,
  placeholder,
  stacked,
}: {
  id: string;
  label: string;
  value: Localized;
  onChange: (v: Localized) => void;
  multiline?: boolean;
  /** One language per row — for narrow panels, where three columns truncate the text. */
  stacked?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: Localized;
}) {
  const { t } = useAdminT();
  const set = (lang: Lang, text: string) => onChange({ ...value, [lang]: text });
  return (
    <fieldset className="rounded-2xl border border-line p-4">
      <legend className="px-1.5 text-sm font-semibold text-navy-900">
        {label}
        {required && <span className="ms-1 text-gold-600">*</span>}
      </legend>
      <div
        className={cn("grid gap-3", stacked ? "" : multiline ? "lg:grid-cols-3" : "sm:grid-cols-3")}
      >
        {SITE_LANGS.map((lang) => {
          const fieldId = `${id}-${lang}`;
          const common = {
            id: fieldId,
            lang,
            value: value[lang] ?? "",
            placeholder:
              placeholder?.[lang] ?? (lang === DEFAULT_LANG ? "" : (value[DEFAULT_LANG] ?? "")),
            "aria-invalid": (lang === DEFAULT_LANG && Boolean(error)) || undefined,
          };
          return (
            <div key={lang}>
              <label
                htmlFor={fieldId}
                className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted"
              >
                <span className="rounded bg-paper px-1.5 py-0.5 font-bold text-navy-800">
                  {LANG_META[lang].short}
                </span>
                {LANG_META[lang].native}
              </label>
              {multiline ? (
                <Textarea
                  {...common}
                  className="min-h-32 text-sm"
                  onChange={(e) => set(lang, e.target.value)}
                />
              ) : (
                <Input
                  {...common}
                  className="h-11 text-sm"
                  onChange={(e) => set(lang, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-gold-700">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">{hint ?? t("translationsHint")}</p>
      )}
    </fieldset>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 ring-1",
        accent ? "bg-navy-900 text-white ring-navy-900" : "bg-white ring-navy-900/6",
      )}
    >
      <p className={cn("text-xs font-semibold", accent ? "text-gold-300" : "text-muted")}>
        {label}
      </p>
      <p className="font-display mt-2 text-[30px] leading-none font-bold tabular-nums">{value}</p>
      {hint && (
        <div className={cn("mt-2 text-xs", accent ? "text-white/60" : "text-muted")}>{hint}</div>
      )}
    </div>
  );
}

export const adminButton = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-55",
  gold: "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-600 disabled:opacity-55",
  secondary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-navy-900 ring-1 ring-line transition-colors hover:bg-paper disabled:opacity-55",
  danger:
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-50 disabled:opacity-55",
  icon: "grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-paper hover:text-navy-900 disabled:opacity-40",
} as const;

/** Wide tables scroll inside their own box, never the whole admin shell. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="-mx-5 overflow-x-auto sm:-mx-6">{children}</div>;
}
