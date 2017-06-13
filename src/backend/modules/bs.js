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

module.exports = function bsModule({onStatusChange}) {

  /**
   * start blinksocks client
   * @param push
   * @param config
   */
  function start(push, {config}) {
    if (bs) {
      bs.terminate();
    }
    try {
      bs = new Hub(config);
      bs.run(() => {
        push(MAIN_START_BS);
        onStatusChange(true);
      });
    } catch (err) {
      logger.error(err);
      push(MAIN_ERROR, err.message);
    }
  }

  /**
   * stop blinksocks client
   * @param push
   */
  function stop(push) {
    if (bs) {
      bs.terminate();
      bs = null;
    }
    push(MAIN_STOP_BS);
    onStatusChange(false);
  }

  return {
    [RENDERER_START_BS]: start,
    [RENDERER_STOP_BS]: stop,
  };
};
