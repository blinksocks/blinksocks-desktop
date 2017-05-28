const ISysProxy = require('./interface');

module.exports = class LinuxSysProxy extends ISysProxy {

  // It's hard to find a system-wide solution to set system proxy on linux desktop(GNOME, KDE, etc.),
  // users should set system proxy manually at present, this is recommended.
  //
  // Documents should point out some workaround, please also see:
  // https://justintung.com/2013/04/25/how-to-configure-proxy-settings-in-linux/

};
