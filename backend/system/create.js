/**
 * create platform-related SysProxy
 */
function createSysProxy() {
  const platform = process.platform;
  const proxyClass = require(`./platforms/${platform}`);
  return new proxyClass();
}

module.exports = {
  createSysProxy
};
