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
  'SAVE_CONFIG',
  'START_BS',
  'STOP_BS',
  'START_PAC',
  'STOP_PAC',
  'SET_SYS_PAC',
  'SET_SYS_PROXY',
  'RESTORE_SYS_PAC',
  'RESTORE_SYS_PROXY',
  'UPDATE_PAC',
  'UPDATE_PAC_FAIL',
  'UPDATE_SELF',
  'UPDATE_SELF_PROGRESS',
  'UPDATE_SELF_FAIL',
  'UPDATE_SELF_CANCEL',
  'PREVIEW_LOGS',
  'QUERY_BS_LOG',
  'QUERY_BSD_LOG',
  'STREAM_BS_LOG',
  'STREAM_BSD_LOG',
  'CREATE_QR_CODE',
  'COPY_QR_CODE_AS_IMAGE',
  'COPY_QR_CODE_AS_TEXT'
]));
