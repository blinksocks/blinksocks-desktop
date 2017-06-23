export const defs = {
  'ss-base': [],
  'ss-stream-cipher': [{
    key: 'method',
    type: 'enum',
    values: [
      'aes-128-ctr', 'aes-192-ctr', 'aes-256-ctr',
      'aes-128-cfb', 'aes-192-cfb', 'aes-256-cfb',
      'camellia-128-cfb', 'camellia-192-cfb', 'camellia-256-cfb',
      'aes-128-ofb', 'aes-192-ofb', 'aes-256-ofb',
      'aes-128-cbc', 'aes-192-cbc', 'aes-256-cbc'
    ],
    defaultValue: 'aes-256-cfb'
  }],
  'ss-aead-cipher': [{
    key: 'method',
    type: 'enum',
    values: [
      'aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm'
    ],
    defaultValue: 'aes-256-gcm'
  }, {
    key: 'info',
    type: 'string',
    defaultValue: 'ss-subkey'
  }],
  'aead-random-cipher': [{
    key: 'method',
    type: 'enum',
    values: [
      'aes-128-gcm', 'aes-192-gcm', 'aes-256-gcm'
    ],
    defaultValue: 'aes-256-gcm'
  }, {
    key: 'info',
    type: 'string',
    defaultValue: 'bs-subkey'
  }, {
    key: 'factor',
    type: 'number',
    defaultValue: 2
  }],
  'obfs-http': [{
    key: 'file',
    type: 'string',
    defaultValue: ''
  }],
  'obfs-tls1.2-ticket': [{
    key: 'sni',
    type: 'array',
    defaultValue: []
  }]
};

export function isPresetsCompatibleToSS(presets) {
  if (!Array.isArray(presets)) {
    return false;
  }
  if (presets.length !== 2) {
    return false;
  }
  if (presets[0].name !== 'ss-base') {
    return false;
  }
  if (!['ss-stream-cipher', 'ss-aead-cipher'].includes(presets[1].name)) {
    return false;
  }
  if (presets[1].name === 'ss-aead-cipher' && presets[1].params.info !== 'ss-subkey') {
    return false;
  }
  return true;
}
