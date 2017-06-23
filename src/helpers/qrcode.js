import {defs} from '../defs/presets';

/**
 * parse QR code text for shadowsocks
 * @param text
 * @returns {object}
 */
function parseSS(text) {
  // `ss://${method}:${key}@${host}:${port}?xxx=xxx`
  const str = atob(text.substr(5));

  let index = str.lastIndexOf('@');
  if (index === -1) {
    return null;
  }

  const method_key = str.slice(0, index);
  const host_port_query = str.slice(index + 1);

  // method and key
  index = method_key.indexOf(':');
  if (index === -1) {
    return null;
  }

  const [method, key] = [method_key.slice(0, index), method_key.slice(index + 1)];
  if (!method || !key) {
    return null;
  }

  // presets
  let presets = [{name: 'ss-base', params: {}}];
  if (defs['ss-stream-cipher'][0].values.includes(method)) {
    presets.push({name: 'ss-stream-cipher', params: {method}});
  } else if (defs['ss-aead-cipher'][0].values.includes(method)) {
    presets.push({name: 'ss-aead-cipher', params: {method, info: 'ss-subkey'}});
  } else {
    return null;
  }

  // drop query
  let host_port = host_port_query;
  if (host_port.indexOf('?') !== -1) {
    host_port = host_port.split('?')[0];
  }

  // host and port
  const [host, port] = host_port.split(':');
  if (!host || !port) {
    return null;
  }

  const _port = +port;
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
    remarks: `${host}:${port}`
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
