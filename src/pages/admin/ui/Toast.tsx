import { CircleAlert, CircleCheck, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error";
interface ToastItem {
  id: number;
  tone: Tone;
  text: string;
}
interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);

/**
 * One toast for every admin write. Mounted in the admin layout around the routed
 * page, so a toast fired by a page that then navigates away still shows.
 */
export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((i) => i.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (tone: Tone, text: string) => {
      seq.current += 1;
      const id = seq.current;
      setItems((list) => [...list.slice(-3), { id, tone, text }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3200),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) window.clearTimeout(timer);
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (text) => push("success", text), error: (text) => push("error", text) }),
    [push],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl p-4 text-sm font-medium shadow-2xl ring-1",
              item.tone === "error"
                ? "bg-navy-950 text-white ring-2 ring-gold-500"
                : "bg-navy-900 text-white ring-navy-800",
            )}
          >
            {item.tone === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-gold-400" aria-hidden />
            ) : (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-gold-300" aria-hidden />
            )}
            <p className="flex-1">{item.text}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="-m-1 rounded-full p-1 opacity-70 hover:opacity-100"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <AdminToastProvider>");
  return ctx;
}
