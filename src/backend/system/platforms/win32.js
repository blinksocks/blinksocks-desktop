const ISysProxy = require('./interface');
const {exec} = require('../../helpers/shell');
const {WIN32_SYSPROXY_HELPER} = require('../../constants');

module.exports = class Win32SysProxy extends ISysProxy {

  constructor() {
    super();
    this._agent = WIN32_SYSPROXY_HELPER;
  }

  async setGlobal({host, port, bypass}) {
    if (host && port) {
      await exec(`${this._agent} global ${host}:${port} "${bypass.join(';')}"`);
    }
  }

  async setPAC({url}) {
    if (url) {
      await exec(`${this._agent} pac ${url}`);
    }
  }

  async restorePAC() {
    await this._restore();
  }

  async restoreGlobal() {
    await this._restore();
  }

  async _restore() {
    // const {flags, proxyServer, bypassList, pacUrl} = this._backups;
    // await exec(`${this._agent} set ${flags} ${proxyServer} ${bypassList} ${pacUrl}`);
    await exec(`${this._agent} set 9`);
  }

};
