module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
      // Work around chrome-launcher EPERM on Windows temp dir cleanup
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    // NOT temporary-public-storage. That target uploads the full Lighthouse
    // report - including screenshots and captured page content - to a public,
    // unauthenticated Google bucket and prints the URL into the build log.
    // On a public repo that makes the capture world-readable. Fixed 2026-08-27.
    upload: { target: 'filesystem', outputDir: './.lighthouseci' },
  },
};
