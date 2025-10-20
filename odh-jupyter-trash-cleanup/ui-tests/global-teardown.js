const fs = require('fs');

module.exports = async () => {
  const galataRoot = process.env.XDG_DATA_HOME;
  if (!galataRoot) return;
  try {
    fs.rmSync(galataRoot, { recursive: true, force: true });
  } catch {}
};


