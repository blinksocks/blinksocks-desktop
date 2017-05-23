module.exports = class ISysProxy {

  async setGlobal(/* {host, port, bypass} */) {
    console.info('abstract method ISysProxy.setGlobal() is called, perhaps you should make an implementation.');
  }

  async setPAC(/* {url} */) {
    console.info('abstract method ISysProxy.setPAC() is called, perhaps you should make an implementation.');
  }

  async restoreGlobal(/* {host, port, bypass} */) {
    console.info('abstract method ISysProxy.restoreGlobal() is called, perhaps you should make an implementation.');
  }

  async restorePAC(/* {url} */) {
    console.info('abstract method ISysProxy.restorePAC() is called, perhaps you should make an implementation.');
  }

};
