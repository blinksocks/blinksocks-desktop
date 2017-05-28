const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dgram = require('dgram');
const EventEmitter = require('events');
const sudo = require('sudo-prompt');
const logger = require('winston');

const ISysProxy = require('./interface');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const SUDO_AGENT_PORT_FILE = path.join(BLINKSOCKS_DIR, '.sudo-agent');

class DarwinSysProxyHelper extends EventEmitter {

  constructor(sender, verifyTag) {
    super();
    // private members
    this._sender = sender;
    this._verifyTag = verifyTag;
    this._agentPort = 0;

    // events
    sender.on('message', this.onMessage.bind(this));

    // watch SUDO_AGENT_PORT_FILE for any changes
    let isReady = false;
    fs.watchFile(SUDO_AGENT_PORT_FILE, () => {
      if (!isReady) {
        this._agentPort = parseInt(fs.readFileSync(SUDO_AGENT_PORT_FILE), 10);
        this.emit('ready');
        isReady = true;
      }
    });
  }

  onMessage(msg) {
    let json = null;
    try {
      json = JSON.parse(msg.toString());
    } catch (err) {
      // drop invalid msg
      logger.error(`unable to parse msg`);
      return;
    }

    const {tag} = json;

    // drop msg with invalid tag
    if (tag !== this._verifyTag) {
      logger.error(`invalid tag detected: ${tag}`);
      return;
    }

    logger.debug(`server response: ${json}`);
  }

  getSysProxyInstance() {
    class ProxyClass {
    }
    // wrap all methods of ISysProxy
    const methods = Object.getOwnPropertyNames(ISysProxy.prototype).slice(1);

    // add a method to kill sudo agent if necessary
    methods.push('killAgent');

    for (const method of methods) {
      ProxyClass.prototype[method] = (args) => {
        // send request with verify tag
        const request = JSON.stringify({
          tag: this._verifyTag,
          method,
          args
        });
        try {
          this._sender.send(request, this._agentPort, 'localhost');
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
  let sender = dgram.createSocket('udp4');

  const SUDO_AGENT_MODULE = path.join(__dirname, '..', 'sudo-agent.js');
  const SUDO_AGENT_TARGET_MODULE = path.join(__dirname, 'darwin.sudo.js');

  // grant root permission to sudo-agent.js
  const SUDO_AGENT_VERIFY_TAG = crypto.randomBytes(16).toString('hex');
  const command = [
    process.execPath,
    `"${SUDO_AGENT_MODULE}"`,
    `"${SUDO_AGENT_VERIFY_TAG}"`,
    `"${SUDO_AGENT_TARGET_MODULE}"`,
    `"${SUDO_AGENT_PORT_FILE}"`,
    process.getuid(),
    process.getgid()
  ].join(' ');

  logger.info(command);

  sudo.exec(command, {name: 'blinksocks desktop'}, function (error/*, stdout, stderr*/) {
    if (error) {
      logger.error(error);
      sender.close();
      // TODO: fallback to manual mode
    }
    // console.log(stdout);
    // console.log(stderr);
  });

  return new DarwinSysProxyHelper(sender, SUDO_AGENT_VERIFY_TAG);
};
