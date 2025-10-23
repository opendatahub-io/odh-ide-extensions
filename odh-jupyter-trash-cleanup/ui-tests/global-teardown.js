const fs = require('fs');

module.exports = async () => {
  const galataRoot = process.env.XDG_DATA_HOME;
  if (!galataRoot) return;
  if (!galataRoot.includes('.galata-root') && !galataRoot.includes('ui-tests')) {
    console.warn(`Skipping cleanup: XDG_DATA_HOME path does not appear to be a test directory: ${galataRoot}`);
    return;
  }
  try {
    fs.rmSync(galataRoot, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to clean up Galata root after running tests (${XDG_DATA_HOME}):`, error.message);
  }
};


