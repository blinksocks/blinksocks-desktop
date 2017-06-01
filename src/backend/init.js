const fs = require('fs');
const path = require('path');

const {
  BLINKSOCKS_DIR,
  LOG_DIR,
  DEFAULT_GFWLIST_PATH
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
