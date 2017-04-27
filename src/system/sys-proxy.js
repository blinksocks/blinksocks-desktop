module.exports.createSysProxy = function () {
  const platform = process.platform;
  const proxyClass = require(`./platforms/${platform}`);
  return new proxyClass();
};
