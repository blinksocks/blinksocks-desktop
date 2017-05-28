const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const ISysProxy = require('./interface');
const {exec} = require('../../helpers/shell');

const SYSPROXY_ORIGIN_PATH = path.join(__dirname, '../../resources/proxy_conf_helper');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const SYSPROXY_PATH = path.join(BLINKSOCKS_DIR, 'proxy_conf_helper');

module.exports = class DarwinSudo extends ISysProxy {

  constructor() {
    super();
    this._agent = SYSPROXY_PATH;
    try {
      fs.lstatSync(SYSPROXY_PATH);
    } catch (err) {
      if (err.code === 'ENOENT') {
        const inp = fs.createReadStream(SYSPROXY_ORIGIN_PATH);
        const out = fs.createWriteStream(SYSPROXY_PATH, {mode: 0o755});
        inp.pipe(out);
      }
    }
  }

  async setGlobal({port}) {
    if (port) {
      await exec(`${this._agent} --mode global --port ${port}`);
    }
  }

  async setPAC({url}) {
    if (url) {
      await exec(`${this._agent} --mode auto --pac-url ${url}`);
    }
  }

  async restoreGlobal({port}) {
    await exec(`${this._agent} --mode off --port ${port}`);
  }

  async restorePAC({url}) {
    await exec(`${this._agent} --mode off --pac-url ${url}`);
  }

  killAgent() {
    process.exit(0);
  }

};
