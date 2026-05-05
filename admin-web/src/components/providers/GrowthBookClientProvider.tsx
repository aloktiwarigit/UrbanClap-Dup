'use client';

/**
 * Thin client-only wrapper that supplies the GrowthBook singleton to the
 * React component tree via the official GrowthBookProvider context.
 *
 * Because GrowthBook's `gb` singleton and `GrowthBookProvider` are both
 * client-side constructs, this component must be 'use client'. It is
 * intentionally thin — all initialization logic lives in `@/lib/growthbook`.
 *
 * E13-S05 — initial SDK wiring for admin-web.
 */

import { type ReactNode } from 'react';
import { GrowthBookProvider } from '@growthbook/growthbook-react';
import { gb } from '@/lib/growthbook';

interface GrowthBookClientProviderProps {
  children: ReactNode;
}

export function GrowthBookClientProvider({ children }: GrowthBookClientProviderProps) {
  return <GrowthBookProvider growthbook={gb}>{children}</GrowthBookProvider>;
}
