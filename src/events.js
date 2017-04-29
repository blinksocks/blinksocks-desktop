module.exports = {
  // renderer process
  RENDERER_INIT: 'renderer/init',
  RENDERER_TERMINATE: 'renderer/terminate',
  RENDERER_SAVE_CONFIG: 'renderer/save-config',
  RENDERER_START_BS: 'renderer/start-bs',
  RENDERER_TERMINATE_BS: 'renderer/terminate-bs',
  RENDERER_SET_SYS_PAC: 'renderer/set-sys-pac',
  RENDERER_SET_SYS_PROXY: 'renderer/set-sys-proxy',
  RENDERER_SET_SYS_PROXY_BYPASS: 'renderer/set-sys-proxy-bypass',
  RENDERER_RESTORE_SYS_PAC: 'renderer/restore-sys-pac',
  RENDERER_RESTORE_SYS_PROXY: 'renderer/restore-sys-proxy',
  RENDERER_RESTORE_SYS_PROXY_BYPASS: 'renderer/restore-proxy-bypass',
  // main process
  MAIN_INIT: 'main/init',
  MAIN_ERROR: 'main/error',
  MAIN_TERMINATE: 'main/terminate'
};
