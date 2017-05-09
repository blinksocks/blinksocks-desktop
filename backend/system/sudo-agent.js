const dgram = require('dgram');
const path = require('path');
const fs = require('fs');
const os = require('os');

const HOME_DIR = os.homedir();
const BLINKSOCKS_DIR = path.join(HOME_DIR, '.blinksocks');
const BLINKSOCKS_SUDO_AGENT_PORT = path.join(BLINKSOCKS_DIR, '.sudo-agent');

const server = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');

console.log(process.argv);

const ProxyClass = require(process.argv[2]);
const sysProxy = new ProxyClass();

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', async (msg, rinfo) => {
  console.log(typeof msg);
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  const {method, args} = JSON.parse(msg.toString());
  if (typeof sysProxy[method] === 'function') {
    await sysProxy[method](args);

  }
});

server.on('listening', () => {
  const address = server.address();
  fs.writeFileSync(BLINKSOCKS_SUDO_AGENT_PORT, address.port.toString());
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind();
