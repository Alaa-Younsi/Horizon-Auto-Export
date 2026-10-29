// Editor shim so the project's TypeScript server understands Deno edge functions.
// The real types come from the Deno runtime at deploy time.
declare namespace Deno {
  const env: { get(key: string): string | undefined };
  function serve(handler: (req: Request) => Response | Promise<Response>): void;
}
declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
