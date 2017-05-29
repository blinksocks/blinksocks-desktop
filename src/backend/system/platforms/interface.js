const logger = require('../../helpers/logger');

module.exports = class ISysProxy {

  async setGlobal(/* {host, port, bypass} */) {
    logger.warn('abstract method ISysProxy.setGlobal() is called, perhaps you should make an implementation.');
  }

  async setPAC(/* {url} */) {
    logger.warn('abstract method ISysProxy.setPAC() is called, perhaps you should make an implementation.');
  }

  async restoreGlobal(/* {host, port, bypass} */) {
    logger.warn('abstract method ISysProxy.restoreGlobal() is called, perhaps you should make an implementation.');
  }

  async restorePAC(/* {url} */) {
    logger.warn('abstract method ISysProxy.restorePAC() is called, perhaps you should make an implementation.');
  }

};
