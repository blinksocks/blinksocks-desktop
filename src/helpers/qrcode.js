import {defs} from '../defs/presets';

/**
 * parse QR code text for shadowsocks
 * @param text
 * @returns {object}
 */
function parseSS(text) {
  // `${method}:${key}@${host}:${port}?xxx=xxx`
  const str = decodeURI(atob(text.substr(5)));
  const sections = str.split('@');
  if (sections.length !== 2) {
    return null;
  }

  let presets = [{name: 'ss-base', params: {}}];

  const [method, key] = sections[0].split(':');
  if (!method || !key) {
    return null;
  }

  if (defs['ss-stream-cipher'][0].values.includes(method)) {
    presets.push({name: 'ss-stream-cipher', params: {method}});
  } else if (defs['ss-aead-cipher'][0].values.includes(method)) {
    presets.push({name: 'ss-aead-cipher', params: {method, info: 'ss-subkey'}});
  } else {
    return null;
  }

  const [host, port] = sections[1].split(':');
  if (!host || !port) {
    return null;
  }

  let _port = port;

  if (_port.indexOf('?') !== -1) {
    _port = _port.split('?')[0];
  }

  _port = +_port;
  if (!Number.isSafeInteger(_port) || _port < 0 || _port > 65535) {
    return null;
  }

  const server = {
    enabled: false,
    host,
    port: _port,
    transport: 'tcp',
    key,
    presets,
    remarks: 'New Server(Scanned)'
  };

  if (validate(server)) {
    return server;
  }
  return null;
}

/**
 * parse QR code text for blinksocks
 * @param text
 * @returns {object}
 */
function parseBS(text) {
  try {
    const server = JSON.parse(atob(text.substr(5)));
    if (validate(server)) {
      return server;
    }
  } catch (err) {
    // suppress parse error
  }
  return null;
}

/**
 * validate parse result
 * @param server
 * @returns {boolean}
 */
function validate(server) {
  if (typeof server !== 'object') {
    return false;
  }
  if (server.host.length < 1) {
    return false;
  }
  if (typeof server.port !== 'number') {
    return false;
  }
  if (server.port < 0 || server.port > 65535) {
    return false;
  }
  if (!Array.isArray(server.presets) || server.presets.length < 1) {
    return false;
  }
  if (server.presets.some(({name, params}) => !name || (typeof params !== 'object'))) {
    return false;
  }
  return true;
}

export function parseQrCodeText(text) {
  // parse shadowsocks version
  if (text.startsWith('ss://')) {
    return parseSS(text);
  }

  // parse blinksocks version
  if (text.startsWith('bs://')) {
    return parseBS(text);
  }

  return null;
}
