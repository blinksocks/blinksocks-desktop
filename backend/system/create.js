const path = require('path');
const sudo = require('sudo-prompt');
const dgram = require('dgram');
const ISysProxy = require('./platforms/interface');

class DarwinSysProxyWrapper {

  constructor(sudoer) {
    const funcs = Object.getOwnPropertyNames(ISysProxy.prototype).slice(1);
    for (const func of funcs) {
      this[func] = (args) => {
        sudoer.send(JSON.stringify({method: func, args: args}), 0, '0.0.0.0');
      };
    }
  }

}

/**
 * create platform-related SysProxy
 */
function createSysProxy() {
  const platform = process.platform;
  const proxyClass = require(`./platforms/${platform}`);
  if (platform === 'darwin') {
    const SUDO_AGENT_MODULE = path.join(__dirname, 'sudo-agent.js');
    const SUDO_AGENT_TARGET_MODULE = path.join(__dirname, 'platforms', 'darwin.js');
    const client = dgram.createSocket('udp4');
    sudo.exec(`node ${SUDO_AGENT_MODULE} "${SUDO_AGENT_TARGET_MODULE}"`, {
      name: 'blinksocks-desktop'
    });
    return new DarwinSysProxyWrapper(client);
  } else {
    return new proxyClass();
  }
}

module.exports = {
  createSysProxy
};
