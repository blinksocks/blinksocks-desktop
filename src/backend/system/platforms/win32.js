const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const ISysProxy = require('./interface');
const {exec} = require('../../helpers/shell');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');

const SYSPROXY_GZ_PATH = path.join(__dirname, '../../resources/sysproxy.exe.gz');
const SYSPROXY64_GZ_PATH = path.join(__dirname, '../../resources/sysproxy64.exe.gz');

const SYSPROXY_PATH = path.join(BLINKSOCKS_DIR, 'sysproxy.exe');
const SYSPROXY64_PATH = path.join(BLINKSOCKS_DIR, 'sysproxy64.exe');

module.exports = class Win32SysProxy extends ISysProxy {

  constructor() {
    super();
    this._agent = null;
    this._backups = {};
    this.init();
  }

  async init() {
    // 1. extract sysproxy(64).exe.gz if not exist
    const arch = os.arch();
    switch (arch) {
      case 'x32':
        await this.unzip(SYSPROXY_GZ_PATH, SYSPROXY_PATH);
        this._agent = SYSPROXY_PATH;
        break;
      case 'x64':
        await this.unzip(SYSPROXY64_GZ_PATH, SYSPROXY64_PATH);
        this._agent = SYSPROXY64_PATH;
        break;
      default:
        throw Error(`unsupported os architecture: ${arch}`);
        break;
    }
    // 2. store system settings
    const {stdout} = await exec(`${this._agent} query`);
    const lines = stdout.split(os.EOL).map((line) => (line === '(null)') ? '-' : line);
    this._backups = {
      flags: lines[0],
      proxyServer: lines[1],
      bypassList: lines[2],
      pacUrl: lines[3]
    };
  }

  async unzip(from, to) {
    try {
      fs.lstatSync(to);
    } catch (err) {
      if (err.code === 'ENOENT') {
        const gzip = zlib.createUnzip();
        const inp = fs.createReadStream(from);
        const out = fs.createWriteStream(to);
        inp.pipe(gzip).pipe(out);
      }
    }
  }

  async setGlobal({host, port, bypass}) {
    if (host && port) {
      // TODO: remove hardcode
      const bypass = [
        '<local>',
        'localhost', '127.*', '10.*',
        '172.16.*', '172.17.*', '172.18.*',
        '172.19.*', '172.20.*', '172.21.*',
        '172.22.*', '172.23.*', '172.24.*',
        '172.25.*', '172.26.*', '172.27.*',
        '172.28.*', '172.29.*', '172.30.*',
        '172.31.*', '172.32.*', '192.168.*'
      ];
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
