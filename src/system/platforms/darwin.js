const ISysProxy = require('./interface');
const {exec} = require('../shell');

const DARWIN_PROXY_TYPE_SOCKS = 0;
const DARWIN_PROXY_TYPE_HTTP = 1;
const DARWIN_PROXY_TYPE_PAC = 2;

/**
 * List all services
 *   networksetup -listallnetworkservices
 *
 * Proxy Bypass
 *   networksetup -getproxybypassdomains <networkservice>
 *   networksetup -setproxybypassdomains <networkservice> <domain1> [domain2] [...]
 *
 * Global Socks5
 *   networksetup -getsocksfirewallproxy <networkservice>
 *   networksetup -setsocksfirewallproxy <networkservice> <domain> <port number>
 *   networksetup -setsocksfirewallproxystate <networkservice> <on off>
 *
 * Global HTTP
 *   networksetup -getwebproxy <networkservice>
 *   networksetup -setwebproxy <networkservice> <domain> <port number>
 *   networksetup -setwebproxystate <networkservice> <on off>
 *
 * PAC mode
 *   networksetup -getautoproxyurl <networkservice>
 *   networksetup -setautoproxyurl <networkservice> <url>
 *   networksetup -setautoproxystate <networkservice> <on off>
 */
module.exports = class DarwinSysProxy extends ISysProxy {

  constructor() {
    super();
    this._services = [];
    this._backups = {};
    this.init();
  }

  async init() {
    this._services = await this._getServices();
    for (const service of this._services) {
      this._backups[service] = {
        socks: await this._getSysSocksProxy(service),
        http: await this._getSysHTTPProxy(service),
        pac: await this._getSysPAC(service),
        bypass: await this._getSysProxyBypass(service)
      };
    }
  }

  getServices() {
    return this._services;
  }

  async setSocksProxy(service, host, port) {
    const enabled = !!(host && port);
    await this._setSysProxy(DARWIN_PROXY_TYPE_SOCKS, service, {enabled, host, port});
  }

  async restoreSocksProxy(service) {
    await this._setSysProxy(DARWIN_PROXY_TYPE_SOCKS, service, this._backups[service].socks);
  }

  async setHTTPProxy(service, host, port) {
    const enabled = !!(host && port);
    await this._setSysProxy(DARWIN_PROXY_TYPE_HTTP, service, {enabled, host, port});
  }

  async restoreHTTPProxy(service) {
    await this._setSysProxy(DARWIN_PROXY_TYPE_HTTP, service, this._backups[service].http);
  }

  async setPAC(service, url) {
    const enabled = !!(url);
    await this._setSysProxy(DARWIN_PROXY_TYPE_PAC, service, {enabled, url});
  }

  async restorePAC(service) {
    await this._setSysProxy(DARWIN_PROXY_TYPE_PAC, service, this._backups[service].pac);
  }

  async setBypass(service, domains) {
    await this._setSysProxyBypass(service, domains);
  }

  async restoreByPass(service) {
    await this._setSysProxyBypass(service, this._backups[service].bypass);
  }

  // privates

  async _getServices() {
    const {stdout} = await exec('networksetup -listallnetworkservices');
    return stdout.split('\n').slice(1, -1);
  }

  async _getSysSocksProxy(service) {
    return this._getSysProxy(DARWIN_PROXY_TYPE_SOCKS, service);
  }

  async _getSysHTTPProxy(service) {
    return this._getSysProxy(DARWIN_PROXY_TYPE_HTTP, service);
  }

  async _getSysPAC(service) {
    return this._getSysProxy(DARWIN_PROXY_TYPE_PAC, service);
  }

  async _getSysProxy(type, service) {
    const cmd = {
      [DARWIN_PROXY_TYPE_SOCKS]: 'getsocksfirewallproxy',
      [DARWIN_PROXY_TYPE_HTTP]: 'getwebproxy',
      [DARWIN_PROXY_TYPE_PAC]: 'getautoproxyurl'
    }[type];
    const {stdout} = await exec(`networksetup -${cmd} "${service}"`);
    const lines = stdout.split('\n').slice(0, -1);

    const obj = {};
    for (const line of lines) {
      const [key, value] = line.split(': ');
      obj[key.trim()] = value.trim();
    }

    const ret = {
      enabled: obj['Enabled'] === 'Yes',
      host: obj['Server'],
      port: obj['Port'] === '0' ? '' : obj['Port'],
      url: obj['URL'] === '(null)' ? '' : obj['URL'] // for PAC
    };

    // trim all [key]: undefined
    for (const key of Object.keys(ret)) {
      if (ret[key] === undefined) {
        delete ret[key];
      }
    }
    return ret;
  }

  async _getSysProxyBypass(service) {
    const {stdout} = await exec(`networksetup -getproxybypassdomains "${service}"`);
    const domains = stdout.split('\n').slice(0, -1);
    return domains.filter((domain) => domain.indexOf('There aren\'t') !== 0);
  }

  async _setSysProxy(type, service, {enabled, host, port, url}) {
    const cmds = [];
    switch (type) {
      case DARWIN_PROXY_TYPE_SOCKS:
        if (host && port) {
          cmds.push(`networksetup -setsocksfirewallproxy "${service}" ${host} ${port}`);
        }
        cmds.push(`networksetup -setsocksfirewallproxystate "${service}" ${enabled ? 'on' : 'off'}`);
        break;
      case DARWIN_PROXY_TYPE_HTTP:
        if (host && port) {
          cmds.push(`networksetup -setwebproxy "${service}" ${host} ${port}`);
        }
        cmds.push(`networksetup -setwebproxystate "${service}" ${enabled ? 'on' : 'off'}`);
        break;
      case DARWIN_PROXY_TYPE_PAC:
        if (url) {
          cmds.push(`networksetup -setautoproxyurl "${service}" ${url}`);
        }
        cmds.push(`networksetup -setautoproxystate "${service}" ${enabled ? 'on' : 'off'}`);
        break;
      default:
        break;
    }
    const codes = [];
    for (const cmd of cmds) {
      codes.push((await exec(cmd.trim())).code);
    }
    if (codes.some((code) => code !== 0)) {
      const name = {
        [DARWIN_PROXY_TYPE_SOCKS]: 'Socks Proxy',
        [DARWIN_PROXY_TYPE_HTTP]: 'HTTP Proxy',
        [DARWIN_PROXY_TYPE_PAC]: 'PAC'
      }[type];
      throw Error(`fail to set ${name} to: ${service}, maybe require root privileges!`);
    }
  }

  async _setSysProxyBypass(service, domains = []) {
    if (domains.length > 0) {
      const {code} = await exec(`networksetup -setproxybypassdomains "${service}" ${domains.join(' ')}`);
      if (code !== 0) {
        throw Error(`fail to set bypass to: ${service}, maybe require root privileges!`);
      }
    }
  }

};
