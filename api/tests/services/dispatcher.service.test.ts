import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dispatcherService } from '../../src/services/dispatcher.service.js';

describe('dispatcherService', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('triggerDispatch logs the correct message', async () => {
    await dispatcherService.triggerDispatch('bk-123');

    expect(consoleSpy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith('DISPATCH_TRIGGERED bookingId=bk-123');
  });

  it('triggerDispatch returns void without throwing', async () => {
    await expect(dispatcherService.triggerDispatch('bk-456')).resolves.toBeUndefined();
  });
});
