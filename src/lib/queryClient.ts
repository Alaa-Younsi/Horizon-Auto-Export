import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      // Content doesn't change while a visitor tabs away; refetching burns their data.
      refetchOnWindowFocus: false,
    },
  },
});
