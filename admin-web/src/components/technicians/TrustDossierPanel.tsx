'use client';
import { useEffect, useState } from 'react';
import type { TechnicianDossier } from '@/types/technician-dossier';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

interface TrustDossierPanelProps {
  technicianId: string | undefined;
}

export function TrustDossierPanel({ technicianId }: TrustDossierPanelProps) {
  const [open, setOpen] = useState(false);
  const [dossier, setDossier] = useState<TechnicianDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!technicianId || !open) return;
    setLoading(true);
    setError(null);
    fetch(`${BASE}/api/v1/technicians/${technicianId}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<TechnicianDossier>;
      })
      .then(setDossier)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [technicianId, open]);

  if (!technicianId) return null;

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-gray-500 font-medium mt-1 hover:text-gray-700"
        aria-expanded={open}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>Trust Profile</span>
      </button>
      {open && (
        <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-3 text-xs space-y-1">
          {loading && <p className="text-gray-400">Loading…</p>}
          {error && <p className="text-red-500">Could not load: {error}</p>}
          {dossier && (
            <>
              <p className="font-semibold">{dossier.displayName}</p>
              <p className="text-gray-500">
                {dossier.totalJobsCompleted} jobs · {dossier.yearsInService} yr exp
              </p>
              <div className="flex gap-2 flex-wrap">
                {dossier.verifiedAadhaar && <Badge label="✓ Aadhaar" />}
                {dossier.verifiedPoliceCheck && <Badge label="✓ Background Check" />}
                {dossier.trainingInstitution && (
                  <Badge label={`✓ Trained: ${dossier.trainingInstitution}`} />
                )}
              </div>
              {dossier.certifications.length > 0 && (
                <p>Certifications: {dossier.certifications.join(', ')}</p>
              )}
              {dossier.languages.length > 0 && (
                <p>Languages: {dossier.languages.join(', ')}</p>
              )}
              {dossier.lastReviews.length > 0 && (
                <div>
                  <p className="font-medium mt-1">Recent Reviews</p>
                  {dossier.lastReviews.map((r, i) => (
                    <div key={i} className="mt-1">
                      <span>{'★'.repeat(Math.round(r.rating))}</span>
                      <span className="text-gray-700 ml-1">{r.text}</span>
                      <span className="text-gray-400 ml-1">{r.date.slice(0, 10)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded bg-green-50 text-green-700 px-1.5 py-0.5 text-xs font-medium">
      {label}
    </span>
  );
}
