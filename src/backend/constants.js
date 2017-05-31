const os = require('os');
const path = require('path');

module.exports = {
  HOME_DIR: os.homedir(),
  BLINKSOCKS_DIR: path.join(HOME_DIR, '.blinksocks'),
  DEFAULT_GFWLIST_PATH: path.join(BLINKSOCKS_DIR, 'gfwlist.txt'),
  DEFAULT_CONFIG_FILE: path.join(BLINKSOCKS_DIR, 'blinksocks.client.js'),
  GFWLIST_URL: 'https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt',
  RELEASES_URL: 'https://github.com/blinksocks/blinksocks-desktop/releases'
};
