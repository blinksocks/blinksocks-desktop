const ISysProxy = require('./interface');

/**
 * List all services
 *   networksetup -listallnetworkservices
 *
 * Global Socks5
 *   networksetup -getsocksfirewallproxy Wi-Fi
 *   networksetup -setsocksfirewallproxy Wi-Fi localhost 1080
 *   networksetup -setproxybypassdomains 127.0.0.1 localhost ...
 *   networksetup -setsocksfirewallproxystate on/off
 *
 * Global HTTP
 *   networksetup -getwebproxy Wi-Fi
 *   networksetup -setwebproxy Wi-Fi localhost 1080
 *   networksetup -setwebproxystate on/off
 *
 * PAC mode
 *   networksetup -getautoproxyurl Wi-Fi
 *   networksetup -setautoproxyurl Wi-Fi http://localhost:1090/proxy.pac
 *   networksetup -setautoproxystate Wi-Fi on/off
 */
module.exports = class DarwinSysProxy extends ISysProxy {

  setSocksProxy() {

  }

  setHTTPProxy() {

  }

  setPAC() {

  }

};
