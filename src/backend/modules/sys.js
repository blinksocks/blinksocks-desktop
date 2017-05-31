const {
  MAIN_SET_SYS_PAC,
  MAIN_SET_SYS_PROXY,
  MAIN_RESTORE_SYS_PAC,
  MAIN_RESTORE_SYS_PROXY,
  RENDERER_SET_SYS_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY
} = require('../../defs/events');

module.exports = function sysModule({sysProxy}) {

  async function setGlobal(e, {host, port, bypass}) {
    await sysProxy.setGlobal({host, port, bypass});
    e.sender.send(MAIN_SET_SYS_PROXY);
  }

  async function setPac(e, {url}) {
    await sysProxy.setPAC({url});
    e.sender.send(MAIN_SET_SYS_PAC);
  }

  async function restoreGlobal(e, {host, port, bypass}) {
    await sysProxy.restoreGlobal({host, port, bypass});
    e.sender.send(MAIN_RESTORE_SYS_PROXY);
  }

  async function restorePac(e, {url}) {
    await sysProxy.restorePAC({url});
    e.sender.send(MAIN_RESTORE_SYS_PAC);
  }

  return {
    [RENDERER_SET_SYS_PROXY]: setGlobal,
    [RENDERER_SET_SYS_PAC]: setPac,
    [RENDERER_RESTORE_SYS_PROXY]: restoreGlobal,
    [RENDERER_RESTORE_SYS_PAC]: restorePac
  };
};
