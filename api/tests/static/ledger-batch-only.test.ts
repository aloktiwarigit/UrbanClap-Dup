import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

/**
 * Static test for ledger-batch-only constraint (E21-S02 Task 12).
 * Asserts that:
 * 1. No direct mutations on commission_receivables container outside the batch helper
 * 2. No incremental mutations on derived figures (remittedAmount, remainingPaise, outstandingPaise)
 */
describe('ledger-batch-only constraints', () => {
  it('should not permit direct .items.create/upsert or .item().replace/delete/patch on commission_receivables', () => {
    const srcDir = join(process.cwd(), 'src');

    function walkDir(dir: string, callback: (filePath: string) => void) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, callback);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          callback(fullPath);
        }
      }
    }

    const violations: string[] = [];

    walkDir(srcDir, (filePath) => {
      // Skip the commission-receivable-repository itself
      if (filePath.endsWith('commission-receivable-repository.ts')) return;

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Pattern: getCommissionReceivablesContainer().items.create/upsert or .item().replace/delete/patch
        const pattern =
          /getCommissionReceivablesContainer\(\)\s*\.items\.(create|upsert)|getCommissionReceivablesContainer\(\)\s*\.item\([^)]*\)\.(replace|delete|patch)/;
        if (pattern.test(line)) {
          violations.push(`${filePath}:${idx + 1}: ${line.trim()}`);
        }
      });
    });

    expect(violations, `Found direct mutations on commission_receivables:\n${violations.join('\n')}`).toEqual([]);
  });

  it('should not permit incremental mutations on derived ledger figures', () => {
    const srcDir = join(process.cwd(), 'src');

    function walkDir(dir: string, callback: (filePath: string) => void) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, callback);
        } else if (entry.isFile() && entry.name.endsWith('.ts')) {
          callback(fullPath);
        }
      }
    }

    const violations: string[] = [];

    walkDir(srcDir, (filePath) => {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        // Pattern: remittedAmount +=/-=, remainingPaise -=, outstandingPaise +=
        const patterns = [
          /\w+\.remittedAmount\s*(\+=|-=)/,
          /\w+\.remittedAmount\s*=\s*\w+\.remittedAmount\s*\+\s*\w+/,
          /\w+\.remainingPaise\s*-=/,
          /\w+\.outstandingPaise\s*\+=/,
          /\w+\.commissionHold\.outstandingPaise\s*=\s*\w+\.commissionHold\.outstandingPaise\s*\+\s*\w+/,
        ];

        for (const pattern of patterns) {
          if (pattern.test(line)) {
            violations.push(`${filePath}:${idx + 1}: ${line.trim()}`);
            break;
          }
        }
      });
    });

    expect(violations, `Found incremental mutations on derived figures:\n${violations.join('\n')}`).toEqual([]);
  });
});
