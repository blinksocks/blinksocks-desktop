import React, {Component} from 'react';
import {Tabs, Tab} from 'material-ui';
import formatDate from 'date-fns/format';
import endOfTomorrow from 'date-fns/end_of_tomorrow';

import {
  RENDERER_QUERY_BS_LOG,
  RENDERER_QUERY_BSD_LOG,
  MAIN_QUERY_BS_LOG,
  MAIN_QUERY_BSD_LOG
} from '../../defs/events';

import {DatePicker} from '../../components';

import './Logs.css';

const {ipcRenderer} = window.require('electron');
const TAB_BLINKSOCKS = 0;
const TAB_BLINKSOCKS_DESKTOP = 1;
const LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

export class Logs extends Component {

  state = {
    tabIndex: TAB_BLINKSOCKS,
    orgLogs: [],
    logs: [],
    filterLevel: '',
    searchKeywords: ''
  };

  constructor(props) {
    super(props);
    this.onTabChange = this.onTabChange.bind(this);
    this.onFilterLevel = this.onFilterLevel.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  componentDidMount() {
    this.onTabChange(this.state.tabIndex);
  }

  onTabChange(value) {
    const setState = ({logs}) => {
      this.setState({
        tabIndex: value,
        orgLogs: logs,
        logs: logs,
        filterLevel: '',
        searchKeywords: ''
      });
    };
    switch (value) {
      case TAB_BLINKSOCKS:
        ipcRenderer.send(RENDERER_QUERY_BS_LOG);
        ipcRenderer.on(MAIN_QUERY_BS_LOG, (e, {logs}) => setState({logs}));
        break;
      case TAB_BLINKSOCKS_DESKTOP:
        ipcRenderer.send(RENDERER_QUERY_BSD_LOG);
        ipcRenderer.on(MAIN_QUERY_BSD_LOG, (e, {logs}) => setState({logs}));
        break;
      default:
        break;
    }
  }

  onFilterLevel(level) {
    const {filterLevel, orgLogs} = this.state;
    if (level === filterLevel) {
      this.setState({
        logs: orgLogs,
        filterLevel: '',
        searchKeywords: ''
      });
    } else {
      this.setState({
        logs: orgLogs.filter((log) => log.level === level),
        filterLevel: level,
        searchKeywords: ''
      });
    }
  }

  onRangeChange(selectedDates) {
    if (selectedDates.length === 2) {
      const type = {
        [TAB_BLINKSOCKS]: RENDERER_QUERY_BS_LOG,
        [TAB_BLINKSOCKS_DESKTOP]: RENDERER_QUERY_BSD_LOG
      }[this.state.tabIndex];
      ipcRenderer.send(type, {
        from: formatDate(selectedDates[0]),
        until: formatDate(selectedDates[1]),
        start: 0,
        limit: 9e5,
        order: 'desc'
      });
      this.setState({
        filterLevel: ''
      });
    }
  }

  onSearch(e) {
    const {orgLogs} = this.state;
    const keywords = e.target.value;
    this.setState({
      logs: keywords === '' ? orgLogs : orgLogs.filter(({level, message, timestamp}) => (
        level.indexOf(keywords) !== -1 ||
        message.indexOf(keywords) !== -1 ||
        timestamp.indexOf(keywords) !== -1
      )),
      filterLevel: '',
      searchKeywords: keywords
    });
  }

  render() {
    const {tabIndex, logs, filterLevel, searchKeywords} = this.state;
    return (
      <div className="logs">
        <Tabs value={tabIndex} onChange={this.onTabChange}>
          <Tab label="blinksocks" value={TAB_BLINKSOCKS}/>
          <Tab label="blinksocks-desktop" value={TAB_BLINKSOCKS_DESKTOP}/>
        </Tabs>
        <div className="logs__toolbox">
          <div className="logs__toolbox__line">
            <ul className="logs__toolbox__legends">
              {LOG_LEVELS.map((level, i) => (
                <li key={i} className="logs__toolbox__legends__item" onClick={() => this.onFilterLevel(level)}>
                  <div className={`logs__toolbox__legends__item__label logs__item--${level}`}>{level}</div>
                  <div className={`logs__toolbox__legends__item__indicator
                        ${level === filterLevel ? '' : 'logs__toolbox__legends__item__indicator--transparent'}`}
                  />
                </li>
              ))}
            </ul>
            <div className="logs__toolbox__range">
              <DatePicker
                flatpickrOptions={{
                  mode: 'range',
                  maxDate: endOfTomorrow(),
                  dateFormat: 'Y-m-d',
                  defaultDate: [
                    logs.length > 0 ? formatDate(logs[logs.length - 1].timestamp, 'Y-m-d') : 'today',
                    'today'
                  ],
                  onChange: this.onRangeChange
                }}
              />
            </div>
          </div>
          <div className="logs__toolbox__line logs__toolbox__line--right">
            <input
              type="text"
              className="logs__toolbox__search"
              placeholder={`Search anything from ${logs.length} records`}
              onClick={(e) => e.target.select()}
              onChange={this.onSearch}
              value={searchKeywords}
            />
          </div>
        </div>
        <div className="logs__items">
          {logs.map(({level, message, timestamp}, i) => (
            <div key={i} className={`logs__item logs__item--${level}`}>
              <abbr className="logs__item__timestamp">{formatDate(timestamp, 'YYYY-MM-DD HH:mm:ss')}</abbr>
              <p className="logs__item__message">{message}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

}
