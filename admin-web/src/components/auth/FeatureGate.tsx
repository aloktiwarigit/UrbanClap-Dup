'use client';

import type { ReactNode } from 'react';
import {
  hasAllCapabilities,
  hasAnyCapability,
  type Capability,
} from '@/admin/capabilities';
import { useAdminAuth } from '@/lib/auth/context';

interface FeatureGateProps {
  capability?: Capability;
  anyOf?: readonly Capability[];
  allOf?: readonly Capability[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureGate({
  capability,
  anyOf,
  allOf,
  fallback = null,
  children,
}: FeatureGateProps) {
  const { auth } = useAdminAuth();
  const role = auth?.role;

  const allowed =
    (capability === undefined || hasAnyCapability(role, [capability])) &&
    (anyOf === undefined || hasAnyCapability(role, anyOf)) &&
    (allOf === undefined || hasAllCapabilities(role, allOf));

  return allowed ? children : fallback;
}
