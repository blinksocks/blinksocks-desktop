const dgram = require('dgram');
const fs = require('fs');
const os = require('os');
const path = require('path');

// check if is running by Electron
if (path.basename(process.execPath) !== 'node') {
  try {
    const {app} = require('electron');
    app.dock.hide();
  } catch (err) {
    console.error(err);
  }
}

// verify command line arguments
if (process.argv.length < 7) {
  console.error('argv must contain at least 7 arguments');
  process.exit(-1);
}

// parse argv
const VERIFY_TAG = process.argv[2];
const TARGET_MODULE = process.argv[3];
const PORT_FILE = process.argv[4];
const UID = parseInt(process.argv[5], 10);
const GID = parseInt(process.argv[6], 10);

// create target module instance
let moduleInstance = null;
try {
  const ModuleClass = require(TARGET_MODULE);
  moduleInstance = new ModuleClass();
} catch (err) {
  console.error(err);
  process.exit(-1);
}

// create dup server
const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
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
  if (tag !== VERIFY_TAG) {
    console.error(`invalid tag detected: ${tag}`);
    return;
  }

  const {method, args} = json;

  if (typeof moduleInstance[method] === 'function') {
    // NOTE: take care of arbitrary command execution
    let ret = await moduleInstance[method](args);
    switch (typeof ret) {
      case 'object':
        ret = JSON.stringify(ret);
        break;
      case 'number':
        ret = ret.toString();
        break;
      default:
        break;
    }
    server.send(JSON.stringify({tag: VERIFY_TAG, payload: ret}), rinfo.port, rinfo.address);
  }
});

server.on('listening', () => {
  const address = server.address();

  // Is it necessary to store UDP port to PORT_FILE?
  // Is there a better workaround?
  fs.writeFileSync(PORT_FILE, address.port.toString());
  fs.chownSync(PORT_FILE, UID, GID);

  console.log(`server listening at udp://${address.address}:${address.port}`);
});

server.on('error', (err) => {
  console.error(`server error:\n${err.stack}`);
  server.close();
});

server.bind();
