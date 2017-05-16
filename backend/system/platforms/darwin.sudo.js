const ISysProxy = require('./interface');
const {exec} = require('../../helpers/shell');

module.exports = class DarwinSudo extends ISysProxy {

  async setGlobal(/* {service, host, port} */) {
    return exec('echo "abc" > /home/micooz/root.txt');
  }

  async setPAC(/* {service, url} */) {
    return exec('ls -alh /root');
  }

  async setBypass(/* {service, domains} */) {

  }

  async restoreGlobal(/* {service} */) {

  }

  async restorePAC(/* {service} */) {

  }

  async restoreByPass(/* {service} */) {

  }

};
