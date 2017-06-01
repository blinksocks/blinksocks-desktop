const winston = require('winston');
const {LOG_FILE_PATH} = require('../constants');

module.exports = new (winston.Logger)({
  level: 'silly',
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      prettyPrint: true
    }),
    new (winston.transports.File)({
      filename: LOG_FILE_PATH,
      maxsize: 2 * 1024 * 1024, // 2MB
    })
  ]
});
