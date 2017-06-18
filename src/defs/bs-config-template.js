module.exports.DEFAULT_CONFIG_STRUCTURE = {
  host: 'localhost',
  port: 1080,
  dns: [],
  servers: [{
    enabled: false,
    remarks: 'Default Server',
    transport: 'tcp',
    host: 'example.com',
    port: 23333,
    key: '',
    presets: [{
      name: 'ss-base',
      params: {}
    }]
  }],
  timeout: 600,
  profile: false,
  watch: false,
  log_level: 'info',
  bypass: [
    '127.0.0.1', '<local>',
    'localhost', '127.*', '10.*',
    '172.16.*', '172.17.*', '172.18.*',
    '172.19.*', '172.20.*', '172.21.*',
    '172.22.*', '172.23.*', '172.24.*',
    '172.25.*', '172.26.*', '172.27.*',
    '172.28.*', '172.29.*', '172.30.*',
    '172.31.*', '172.32.*', '192.168.*'
  ],
  pac: 'http://localhost:1090/proxy.pac',
  pac_status: 0,
  app_status: 0
};