const fs = require('fs');
const crypto = require('crypto');
const dgram = require('dgram');
const EventEmitter = require('events');
const sudo = require('sudo-prompt');
const logger = require('../../helpers/logger');
const {DARWIN_SUDO_AGENT_PATH, DARWIN_SUDO_AGENT_PORT_FILE} = require('../../constants');
const ISysProxy = require('./interface');

class DarwinSysProxyHelper extends EventEmitter {

  constructor(sender, verifyTag) {
    super();
    this._sender = sender;
    this._verifyTag = verifyTag;
    this._agentPort = 0;

    // watch SUDO_AGENT_PORT_FILE for any changes
    fs.watchFile(DARWIN_SUDO_AGENT_PORT_FILE, () => {
      this._agentPort = parseInt(fs.readFileSync(DARWIN_SUDO_AGENT_PORT_FILE), 10);
      this.emit('ready');
      fs.unwatchFile(DARWIN_SUDO_AGENT_PORT_FILE);
    });
  }

  getSysProxyInstance() {
    class ProxyClass {
    }
    // wrap all methods of ISysProxy
    const methods = Object.getOwnPropertyNames(ISysProxy.prototype).slice(1);

    // add a method to kill sudo agent if necessary
    methods.push('kill');

    for (const method of methods) {
      ProxyClass.prototype[method] = (args) => {
        // send request with verify tag
        const request = JSON.stringify({
          tag: this._verifyTag,
          method,
          args
        });
        try {
          this._sender.send(request, this._agentPort, '127.0.0.1');
          logger.debug(`client request: ${request}`);
        } catch (err) {
          logger.error(err);
        }
      };
    }
    return new ProxyClass();
  }

}

module.exports = function () {
  const sender = dgram.createSocket('udp4');
  const SUDO_AGENT_VERIFY_TAG = crypto.randomBytes(16).toString('hex');
  const helper = new DarwinSysProxyHelper(sender, SUDO_AGENT_VERIFY_TAG);

  const fallback = () => {
    sender.close();
    helper.emit('fallback', new ISysProxy()); // fallback to manual mode
  };

  const command = [DARWIN_SUDO_AGENT_PATH, `"${SUDO_AGENT_VERIFY_TAG}"`].join(' ');

  logger.debug(command);

  // grant root permission to sudo-agent.js
  sudo.exec(command, {name: 'blinksocks desktop'}, function (error/*, stdout, stderr*/) {
    if (error) {
      logger.warn(error.message);
      fallback();
    }
  });

  return helper;
};
