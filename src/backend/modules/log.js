const {
  MAIN_ERROR
} = require('../constants');

const {
  RENDERER_QUERY_BS_LOG,
  RENDERER_QUERY_BSD_LOG,
  RENDERER_STREAM_BS_LOG,
  RENDERER_STREAM_BSD_LOG,
  MAIN_QUERY_BS_LOG,
  MAIN_QUERY_BSD_LOG,
  MAIN_STREAM_BS_LOG,
  MAIN_STREAM_BSD_LOG
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
  const bsLoggerStream = bsLogger.stream({start: -1});
  const bsdLoggerStream = bsdLogger.stream({start: -1});

  async function getBSLog(push, options) {
    try {
      const logs = await query(bsLogger, options);
      push(MAIN_QUERY_BS_LOG, {logs});
    } catch (err) {
      push(MAIN_ERROR, err.message);
    }
  }

  async function getBSDLog(push, options) {
    try {
      const logs = await query(bsdLogger, options);
      push(MAIN_QUERY_BSD_LOG, {logs});
    } catch (err) {
      push(MAIN_ERROR, err.message);
    }
  }

  function streamBSLog(push, isOn) {
    if (isOn) {
      bsLoggerStream.on('log', function (log) {
        push(MAIN_STREAM_BS_LOG, {log});
      });
    } else {
      bsLoggerStream.removeAllListeners();
    }
  }

  function streamBSDLog(push, isOn) {
    if (isOn) {
      bsdLoggerStream.on('log', function (log) {
        push(MAIN_STREAM_BSD_LOG, {log});
      });
    } else {
      bsdLoggerStream.removeAllListeners();
    }
  }

  return {
    [RENDERER_QUERY_BS_LOG]: getBSLog,
    [RENDERER_QUERY_BSD_LOG]: getBSDLog,
    [RENDERER_STREAM_BS_LOG]: streamBSLog,
    [RENDERER_STREAM_BSD_LOG]: streamBSDLog
  };
};
