import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { FieldError, Honeypot, Input, Label, Select, Textarea } from "@/components/ui/Field";
import { useFormTimer } from "@/hooks/useFormTimer";
import type { TranslationKey } from "@/i18n/dictionaries";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";
import { notifyStaff } from "@/lib/notify";
import { publicErrorKey } from "@/lib/rpcErrors";
import { type InquiryValues, inquirySchema } from "@/lib/schemas";
import { supabase } from "@/lib/supabase";
import { INQUIRY_KINDS, type InquiryKind } from "@/types/db";

interface InquiryFormProps {
  /** Pre-select a subject (e.g. "sell" from a services link). */
  defaultKind?: InquiryKind;
  /** When set, the inquiry is about this vehicle (the subject picker is hidden). */
  vehicle?: { id: string; label: string };
  className?: string;
  compact?: boolean;
}

const KIND_LABEL: Record<InquiryKind, TranslationKey> = {
  general: "form.kind.general",
  vehicle: "form.kind.vehicle",
  sourcing: "form.kind.sourcing",
  sell: "form.kind.sell",
  export: "form.kind.export",
};

/**
 * The site's one write path, used by the contact page and every vehicle page.
 * Browser checks (zod, honeypot, fill time) are UX; submit_inquiry() re-validates,
 * rate-limits and returns a reference. Staff are notified fire-and-forget after
 * the write succeeded — a notification failure can never undo the inquiry.
 */
export function InquiryForm({
  defaultKind = "general",
  vehicle,
  className,
  compact,
}: InquiryFormProps) {
  const { t, rich, lang, path } = useI18n();
  const uid = useId();
  const timer = useFormTimer();
  const [reference, setReference] = useState<string | null>(null);
  const [serverError, setServerError] = useState<TranslationKey | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      kind: vehicle ? "vehicle" : defaultKind,
      name: "",
      company: "",
      email: "",
      phone: "",
      country: "",
      message: "",
      consent: false,
      website: "",
    },
  });

  const id = (name: string) => `${uid}-${name}`;
  const err = (name: keyof InquiryValues) => {
    const m = errors[name]?.message;
    return m ? t(m as TranslationKey) : undefined;
  };
  const aria = (name: keyof InquiryValues) => ({
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? id(`${name}-err`) : undefined,
  });

  const onSubmit = async (values: InquiryValues) => {
    setServerError(null);
    // A filled honeypot is a bot: act as if it worked, send nothing.
    if (values.website) {
      setReference("HAE-000000-0000000000");
      return;
    }
    if (!supabase) {
      setServerError("error.notConfigured");
      return;
    }
    const { data, error } = await supabase.rpc("submit_inquiry", {
      p: {
        kind: vehicle ? "vehicle" : values.kind,
        vehicle_id: vehicle && !vehicle.id.startsWith("demo-") ? vehicle.id : null,
        name: values.name,
        company: values.company,
        email: values.email,
        phone: values.phone,
        country: values.country,
        message: values.message,
        consent: values.consent,
        language: lang,
        elapsed_ms: timer.elapsed(),
      },
    });
    if (error || !data) {
      setServerError(publicErrorKey(error));
      return;
    }
    notifyStaff({ kind: "inquiry", reference: data });
    setReference(data);
  };

  const again = () => {
    reset();
    timer.reset();
    setReference(null);
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {reference ? (
          <motion.div
            key="done"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            className="rounded-xl bg-navy-900 p-8 text-white"
          >
            <CircleCheck className="size-10 text-gold-300" aria-hidden />
            <p className="font-display mt-5 text-2xl font-bold">{t("form.success.title")}</p>
            <p className="mt-3 text-white/75">{t("form.success.text")}</p>
            <p className="mt-4 inline-block rounded-md bg-white/10 px-4 py-2 font-mono text-lg tracking-wider text-gold-200">
              {reference}
            </p>
            <div>
              <button
                type="button"
                onClick={again}
                className="mt-7 text-sm font-semibold text-gold-300 underline-offset-4 hover:underline"
              >
                {t("form.success.again")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.35 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="relative space-y-5"
          >
            <Honeypot {...register("website")} />

            {vehicle ? (
              <div className="rounded-md border border-gold-200 bg-gold-50 px-4 py-3 text-sm">
                <span className="font-semibold text-gold-700">{t("form.vehicle")}: </span>
                <span className="text-navy-900">{vehicle.label}</span>
              </div>
            ) : (
              <div>
                <Label htmlFor={id("kind")} required>
                  {t("form.kind")}
                </Label>
                <Select id={id("kind")} {...register("kind")}>
                  {INQUIRY_KINDS.filter((k) => k !== "vehicle").map((k) => (
                    <option key={k} value={k}>
                      {t(KIND_LABEL[k])}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className={cn("grid gap-5", !compact && "sm:grid-cols-2")}>
              <div>
                <Label htmlFor={id("name")} required>
                  {t("form.name")}
                </Label>
                <Input
                  id={id("name")}
                  autoComplete="name"
                  {...register("name")}
                  {...aria("name")}
                />
                <FieldError id={id("name-err")} message={err("name")} />
              </div>
              <div>
                <Label htmlFor={id("company")} optional>
                  {t("form.company")}
                </Label>
                <Input
                  id={id("company")}
                  autoComplete="organization"
                  {...register("company")}
                  {...aria("company")}
                />
                <FieldError id={id("company-err")} message={err("company")} />
              </div>
              <div>
                <Label htmlFor={id("email")} required>
                  {t("form.email")}
                </Label>
                <Input
                  id={id("email")}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  {...register("email")}
                  {...aria("email")}
                />
                <FieldError id={id("email-err")} message={err("email")} />
              </div>
              <div>
                <Label htmlFor={id("phone")} optional>
                  {t("form.phone")}
                </Label>
                <Input
                  id={id("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  {...register("phone")}
                  {...aria("phone")}
                />
                <FieldError id={id("phone-err")} message={err("phone")} />
              </div>
              {!compact && (
                <div className="sm:col-span-2">
                  <Label htmlFor={id("country")} optional>
                    {t("form.country")}
                  </Label>
                  <Input
                    id={id("country")}
                    autoComplete="country-name"
                    {...register("country")}
                    {...aria("country")}
                  />
                  <FieldError id={id("country-err")} message={err("country")} />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor={id("message")} required>
                {t("form.message")}
              </Label>
              <Textarea
                id={id("message")}
                placeholder={t("form.messagePlaceholder")}
                {...register("message")}
                {...aria("message")}
              />
              <FieldError id={id("message-err")} message={err("message")} />
            </div>

            <div>
              <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-navy-900"
                  {...register("consent")}
                  {...aria("consent")}
                />
                <span>
                  {rich("form.consent", {
                    link: (
                      <Link
                        to={path("/privacy")}
                        className="font-semibold text-navy-900 underline underline-offset-2 hover:text-gold-600"
                      >
                        {t("form.consentLink")}
                      </Link>
                    ),
                  })}
                </span>
              </label>
              <FieldError id={id("consent-err")} message={err("consent")} />
            </div>

            {serverError && (
              <p
                role="alert"
                className="flex items-start gap-3 rounded-md border border-gold-300 bg-gold-50 p-4 text-sm font-medium text-navy-900"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
                {t(serverError)}
              </p>
            )}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight
                  className="size-4 transition-transform group-hover/btn:translate-x-1"
                  aria-hidden
                />
              )}
              {isSubmitting ? t("form.sending") : t("form.submit")}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
