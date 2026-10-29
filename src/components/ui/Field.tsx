import { CircleAlert } from "lucide-react";
import { type ComponentProps, forwardRef, type ReactNode } from "react";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

// Only the logo's inks: an invalid field is marked by a gold ring + icon + text,
// never by colour alone.
const control =
  "w-full rounded-md border border-line bg-white px-4 text-[15px] text-navy-900 transition-[border-color,box-shadow] duration-200 placeholder:text-muted/60 hover:border-navy-900/30 focus:border-navy-900 focus:shadow-[0_0_0_4px_rgb(8_25_61/0.08)] focus:outline-none aria-[invalid=true]:border-gold-500 aria-[invalid=true]:shadow-[0_0_0_4px_rgb(167_124_56/0.16)] disabled:cursor-not-allowed disabled:bg-paper";

export function Label({
  htmlFor,
  children,
  optional,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
  required?: boolean;
}) {
  const { t } = useI18n();
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-semibold tracking-wide text-navy-900"
    >
      {children}
      {required && (
        <span className="text-gold-600" aria-hidden>
          *
        </span>
      )}
      {optional && <span className="text-xs font-normal text-muted">({t("form.optional")})</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(control, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(control, "min-h-36 resize-y py-3 leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(control, "select-chevron h-12 appearance-none pe-11", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-gold-700"
    >
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

/** Off-screen honeypot. Real visitors never see or fill it; naive bots do. */
export const Honeypot = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Honeypot(props, ref) {
    return (
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
        </label>
      </div>
    );
  },
);
