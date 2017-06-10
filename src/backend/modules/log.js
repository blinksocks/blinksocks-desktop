const {
  MAIN_ERROR
} = require('../constants');

const {
  RENDERER_QUERY_BS_LOG,
  RENDERER_QUERY_BSD_LOG,
  MAIN_QUERY_BS_LOG,
  MAIN_QUERY_BSD_LOG
} = require('../../defs/events');

/**
 * query logs from logger instance, use Loggly Search API
 * @param logger
 * @param options
 * @returns {Promise}
 */
function query(logger, options) {
  return new Promise((resolve, reject) => {
    if (!logger) {
      resolve([]);
    } else {
      const opts = Object.assign({
        from: new Date() - 24 * 60 * 60 * 1000,
        until: new Date(),
        limit: 9e5,
        start: 0,
        order: 'desc'
      }, options || {});
      logger.query(opts, function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results.file);
        }
      });
    }
  });
}

module.exports = function logModule({bsLogger, bsdLogger}) {

  async function getBSLog(e, options) {
    try {
      const logs = await query(bsLogger, options);
      e.sender.send(MAIN_QUERY_BS_LOG, {logs});
    } catch (err) {
      e.sender.send(MAIN_ERROR, err.message);
    }
  }

  async function getBSDLog(e, options) {
    try {
      const logs = await query(bsdLogger, options);
      e.sender.send(MAIN_QUERY_BSD_LOG, {logs});
    } catch (err) {
      e.sender.send(MAIN_ERROR, err.message);
    }
  }

  return {
    [RENDERER_QUERY_BS_LOG]: getBSLog,
    [RENDERER_QUERY_BSD_LOG]: getBSDLog,
  };
};
