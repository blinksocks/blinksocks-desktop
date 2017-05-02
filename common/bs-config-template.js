module.exports.DEFAULT_CONFIG_STRUCTURE = {
  host: 'localhost',
  port: 1080,
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
  pac: 'http://localhost:1090/proxy.pac',
  pac_on: true,
  bypass: ['127.0.0.1', '::1', 'localhost'],
  status: 0
};
