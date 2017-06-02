const {Hub} = require('blinksocks');
const logger = require('../helpers/logger');

const {
  MAIN_ERROR,
  MAIN_START_BS,
  MAIN_STOP_BS,
  RENDERER_START_BS,
  RENDERER_STOP_BS
} = require('../../defs/events');

let bs = null;

module.exports = function bsModule() {

  /**
   * start blinksocks client
   * @param e
   * @param config
   */
  function start(e, {config}) {
    if (bs) {
      bs.terminate();
    }
    try {
      bs = new Hub(config);
      bs.run(() => e.sender.send(MAIN_START_BS));
    } catch (err) {
      logger.error(err);
      e.sender.send(MAIN_ERROR, err.message);
    }
  }

  /**
   * stop blinksocks client
   * @param e
   */
  function stop(e) {
    if (bs) {
      bs.terminate();
      bs = null;
    }
    e.sender.send(MAIN_STOP_BS);
  }

  return {
    [RENDERER_START_BS]: start,
    [RENDERER_STOP_BS]: stop,
  };
};
