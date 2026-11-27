const path = require('node:path');

module.exports = (modulePath) => {
  const resolvedPath = modulePath.startsWith('.') || path.isAbsolute(modulePath)
    ? path.resolve(modulePath)
    : modulePath;
  return Promise.resolve(require(resolvedPath));
};