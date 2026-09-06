import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sweepAllHolds } = vi.hoisted(() => ({ sweepAllHolds: vi.fn() }));

vi.mock('../../src/services/commission-hold.service.js', () => ({ sweepAllHolds }));

import { main } from '../../scripts/backfill-commission-holds.js';

describe('backfill-commission-holds CLI', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sweepAllHolds.mockReset();
    sweepAllHolds.mockResolvedValue({ recomputed: 3, drifted: 1 });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('defaults to dry-run (dryRun: true) when no flag is passed', async () => {
    await main([]);
    expect(sweepAllHolds).toHaveBeenCalledTimes(1);
    expect(sweepAllHolds).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true }));
  });

  it('--dry-run explicitly passes dryRun: true and performs zero patches', async () => {
    await main(['--dry-run']);
    expect(sweepAllHolds).toHaveBeenCalledWith(expect.objectContaining({ dryRun: true }));
  });

  it('--apply passes dryRun: false', async () => {
    await main(['--apply']);
    expect(sweepAllHolds).toHaveBeenCalledWith(expect.objectContaining({ dryRun: false }));
  });

  it('forwards a log callback that sweepAllHolds can call', async () => {
    await main(['--dry-run']);
    const call = sweepAllHolds.mock.calls[0]?.[0] as { log?: (s: string) => void };
    expect(typeof call.log).toBe('function');
    expect(() => call.log?.('hold drift (dry-run) tech-1: CLEAR/0 → WARN/300000')).not.toThrow();
  });

  it('unknown flag exits with code 2 and never calls sweepAllHolds', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await main(['--bogus']);
    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(sweepAllHolds).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });

  it('passing both --dry-run and --apply exits with code 2', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    await main(['--dry-run', '--apply']);
    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(sweepAllHolds).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});
