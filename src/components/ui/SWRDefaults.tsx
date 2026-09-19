"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

/*
  Global SWR defaults: stop retry storms. SWR retries failed requests
  forever by default — during an API outage every mounted hook hammers the
  endpoint (main-thread + network churn that drags FID/TTI, and log spam).
  Cap at 3 retries, 5s apart; per-hook options still override these.
*/

export function SWRDefaults({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        revalidateOnFocus: false,
        dedupingInterval: 30000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
