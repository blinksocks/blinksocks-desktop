const child_process = require('child_process');
const logger = require('./logger');

/**
 * Promised child_process.exec()
 * @param command
 * @param options
 * @param onCreated
 * @returns {Promise}
 */
function exec(command, options = {}, onCreated = null) {
  return new Promise((resolve, reject) => {
    const opts = Object.assign({
      encoding: 'utf-8'
    }, options);
    logger.debug(`[shell] executing: ${command}`);
    const child = child_process.exec(command, opts, function (error, stdout, stderr) {
      if (error) {
        reject({code: error.code, stdout, stderr});
      } else {
        resolve({code: 0, stdout, stderr});
      }
    });
    if (typeof onCreated === 'function') {
      onCreated(child);
    }
  });
}

module.exports = {
  exec
};
