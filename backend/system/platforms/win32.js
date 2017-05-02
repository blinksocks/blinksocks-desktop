const ISysProxy = require('./interface');

/**
 * Global HTTP
 *   reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f
 *   reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d localhost:1080 /f
 *   netsh winhttp import proxy source=ie
 *   netsh winhttp set proxy localhost:1080
 *   reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /f
 *   reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /f
 *   netsh winhttp reset proxy
 */
module.exports = class Win32SysProxy extends ISysProxy {

  setSocksProxy() {

  }

  setHTTPProxy() {

  }

  setPAC() {

  }

};
