const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dgram = require('dgram');
const sudo = require('sudo-prompt');

const ISysProxy = require('./interface');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const SUDO_AGENT_PORT_FILE = path.join(BLINKSOCKS_DIR, '.sudo-agent');

class DarwinSysProxy {

  constructor(sender, verifyTag) {
    // private members
    this._verifyTag = verifyTag;

    // wrap all methods of ISysProxy
    let port = null;
    Object.getOwnPropertyNames(ISysProxy.prototype).slice(1).forEach((func) => {
      this[func] = (args) => {
        // obtain server port from disk
        if (port === null) {
          port = parseInt(fs.readFileSync(SUDO_AGENT_PORT_FILE), 10);
        }
        // send request with verify tag
        const request = JSON.stringify({
          tag: verifyTag,
          method: func,
          args: args
        });
        try {
          sender.send(request, port, 'localhost');
          console.log(`client request: ${request}`);
        } catch (err) {
          console.error(err);
        }
      };
    });

    // events
    sender.on('message', this.onMessage.bind(this));
  }

  onMessage(msg) {
    let json = null;
    try {
      json = JSON.parse(msg.toString());
    } catch (err) {
      // drop invalid msg
      console.error(`unable to parse msg`);
      return;
    }

    const {tag} = json;

    // drop msg with invalid tag
    if (tag !== this._verifyTag) {
      console.error(`invalid tag detected: ${tag}`);
      return;
    }

    console.log(`server response: ${msg}`);
  }

}

module.exports = function () {
  let sender = dgram.createSocket('udp4');

  const SUDO_AGENT_MODULE = path.join(__dirname, '..', 'sudo-agent.js');
  const SUDO_AGENT_TARGET_MODULE = path.join(__dirname, 'darwin.sudo.js');

  // grant root permission to sudo-agent.js
  const SUDO_AGENT_VERIFY_TAG = crypto.randomBytes(16).toString('hex');
  const command = [
    'node',
    `"${SUDO_AGENT_MODULE}"`,
    `"${SUDO_AGENT_VERIFY_TAG}"`,
    `"${SUDO_AGENT_TARGET_MODULE}"`,
    `"${SUDO_AGENT_PORT_FILE}"`,
    process.getuid(),
    process.getgid()
  ].join(' ');

  sudo.exec(command, {name: 'blinksocks desktop'}, function (error/*, stdout, stderr*/) {
    if (error) {
      sender.close();
      console.error(error);
    }
    // console.log(stdout);
    // console.log(stderr);
  });

  return new DarwinSysProxy(sender, SUDO_AGENT_VERIFY_TAG);
};
