const fs = require('fs');
const path = require('path');

const {
  BLINKSOCKS_DIR,
  LOG_DIR,
  DEFAULT_GFWLIST_PATH,
  SUDO_AGENT_CONTROLLER,
  SUDO_AGENT_IMPLEMENT
} = require('./constants');

const BUILT_IN_GFWLIST = path.join(__dirname, 'resources/gfwlist.txt');

function mkdir(dir) {
  try {
    fs.lstatSync(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      fs.mkdirSync(dir);
    }
  }
}

// create ~/.blinksocks directory if not exist
mkdir(BLINKSOCKS_DIR);

// create ~/.blinksocks/logs if not exist
mkdir(LOG_DIR);

// create ~/.blinksocks/gfwlist.txt if not exist
try {
  fs.lstatSync(DEFAULT_GFWLIST_PATH);
} catch (err) {
  if (err.code === 'ENOENT') {
    const data = fs.readFileSync(BUILT_IN_GFWLIST);
    fs.writeFileSync(DEFAULT_GFWLIST_PATH, data);
  }
}

// overwrite ~/sudo-agent.js and ~/darwin.sudo.js for macOS
if (process.platform === 'darwin') {
  const src = [
    ['system/sudo-agent.js', SUDO_AGENT_CONTROLLER],
    ['system/platforms/darwin.sudo.js', SUDO_AGENT_IMPLEMENT],
    ['resources/proxy_conf_helper', path.join(BLINKSOCKS_DIR, 'proxy_conf_helper'), {mode: 0o755}]
  ];
  for (const s of src) {
    const inp = fs.createReadStream(path.join(__dirname, s[0]));
    const out = fs.createWriteStream(s[1], s[2] || {});
    inp.pipe(out);
  }
}
