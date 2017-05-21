/**
 * prefix every event with both "RENDERER_" and "MAIN_"
 * @param events
 * @returns {{}}
 */
function makePairs(events) {
  const map = {};
  for (const e of events) {
    const le = e.toLowerCase();
    map[`RENDERER_${e}`] = `renderer/${le}`;
    map[`MAIN_${e}`] = `main/${le}`;
  }
  return map;
}

module.exports = Object.assign(makePairs([
  'INIT',
  'ERROR',
  'TERMINATE',
  'SAVE_CONFIG',
  'START_BS',
  'START_PAC',
  'TERMINATE_BS',
  'TERMINATE_PAC',
  'SET_SYS_PAC',
  'SET_SYS_PROXY',
  'SET_SYS_PROXY_BYPASS',
  'RESTORE_SYS_PAC',
  'RESTORE_SYS_PROXY',
  'RESTORE_SYS_PROXY_BYPASS'
]), {
  // other events
});
