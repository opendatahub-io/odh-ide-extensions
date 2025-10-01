/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');
const fs = require('fs');
const path = require('path');

// Test root for Jupyter server
const GALATA_ROOT = path.resolve(__dirname, '..', '..', '.galata-root');
try {
  fs.rmSync(GALATA_ROOT, { recursive: true, force: true });
} catch {}
fs.mkdirSync(GALATA_ROOT, { recursive: true });

module.exports = {
  ...baseConfig,
  webServer: {
    command: 'jlpm start',
    url: 'http://localhost:8888/lab',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      JUPYTERLAB_GALATA_ROOT_DIR: GALATA_ROOT
    }
  }
};
