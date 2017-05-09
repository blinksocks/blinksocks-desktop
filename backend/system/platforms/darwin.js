const ISysProxy = require('./interface');

module.exports = class DarwinSysProxy extends ISysProxy {

  async setGlobal(/* {service, host, port} */) {

  }

  async setPAC(/* {service, url} */) {

  }

  async setBypass(/* {service, domains} */) {

  }

  async restoreGlobal(/* {service} */) {

  }

  async restorePAC(/* {service} */) {

  }

  async restoreByPass(/* {service} */) {

  }

};
