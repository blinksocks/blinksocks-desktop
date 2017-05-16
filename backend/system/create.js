/**
 * create platform-related SysProxy
 */
function createSysProxy() {
  const platform = process.platform;
  const ProxyClass = require(`./platforms/${platform}`);
  return new ProxyClass();
}

module.exports = {
  createSysProxy
};
