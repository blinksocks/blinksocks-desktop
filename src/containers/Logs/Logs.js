import React, {Component, PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Tabs, Tab} from 'material-ui';
import formatDate from 'date-fns/format';
import endOfTomorrow from 'date-fns/end_of_tomorrow';
import debounce from 'lodash.debounce';

import {
  RENDERER_QUERY_BS_LOG,
  RENDERER_QUERY_BSD_LOG,
  RENDERER_STREAM_BS_LOG,
  RENDERER_STREAM_BSD_LOG,
  MAIN_QUERY_BS_LOG,
  MAIN_QUERY_BSD_LOG,
  MAIN_STREAM_BS_LOG,
  MAIN_STREAM_BSD_LOG
} from '../../defs/events';

import {DatePicker} from '../../components';

import './Logs.css';

const {ipcRenderer} = window.require('electron');
const TAB_BLINKSOCKS = 0;
const TAB_BLINKSOCKS_DESKTOP = 1;

class LogLevelFilters extends PureComponent {

  static LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

  static propTypes = {
    level: PropTypes.string,
    onFilter: PropTypes.func
  };

  static defaultProps = {
    level: '',
    onFilter: () => {
    }
  };

  render() {
    const levels = LogLevelFilters.LOG_LEVELS;
    return (
      <ul className="logs__toolbox__legends">
        {levels.map((level, i) => (
          <li key={i} className="logs__toolbox__legends__item" onClick={() => this.props.onFilter(level)}>
            <div className={`logs__toolbox__legends__item__label logs__item--${level}`}>{level}</div>
            <div
              className={
                `logs__toolbox__legends__item__indicator
              ${level === this.props.level ? '' : 'logs__toolbox__legends__item__indicator--transparent'}`
              }
            />
          </li>
        ))}
      </ul>
    );
  }

}

class LogItems extends PureComponent {

  static propTypes = {
    logs: PropTypes.array
  };

  static defaultProps = {
    logs: []
  };

  render() {
    return (
      <div className="logs__items">
        {this.props.logs.map(({level, message, timestamp}, i) => (
          <div key={i} className={`logs__item logs__item--${level}`}>
            <abbr className="logs__item__timestamp">{formatDate(timestamp, 'YYYY-MM-DD HH:mm:ss')}</abbr>
            <p className="logs__item__message">{message}</p>
          </div>
        ))}
      </div>
    );
  }

}

export class Logs extends Component {

  state = {
    tabIndex: TAB_BLINKSOCKS,
    orgLogs: [],
    logs: [],
    filterLevel: '',
    searchKeywords: '',
    isWatch: false
  };

  constructor(props) {
    super(props);
    this.onTabChange = this.onTabChange.bind(this);
    this.onFilterLevel = this.onFilterLevel.bind(this);
    this.onRangeChange = this.onRangeChange.bind(this);
    this.onSearch = debounce(this.onSearch, 300);
    this.onToggleWatch = this.onToggleWatch.bind(this);
  }

  componentDidMount() {
    this.onTabChange(this.state.tabIndex);
    const setStateThenFilter = ({logs}) => {
      this.setState({logs, orgLogs: logs});
      const {filterLevel, searchKeywords} = this.state;
      if (filterLevel !== '') {
        this.onFilterLevel(filterLevel);
      }
      if (searchKeywords !== '') {
        this.onSearch(searchKeywords);
      }
    };
    ipcRenderer.on(MAIN_QUERY_BS_LOG, (e, {logs}) => setStateThenFilter({logs}));
    ipcRenderer.on(MAIN_QUERY_BSD_LOG, (e, {logs}) => setStateThenFilter({logs}));
    ipcRenderer.on(MAIN_STREAM_BS_LOG, (e, {log}) => setStateThenFilter({logs: [log, ...this.state.orgLogs]}));
    ipcRenderer.on(MAIN_STREAM_BSD_LOG, (e, {log}) => setStateThenFilter({logs: [log, ...this.state.orgLogs]}));
  }

  onTabChange(value) {
    switch (value) {
      case TAB_BLINKSOCKS:
        ipcRenderer.send(RENDERER_QUERY_BS_LOG);
        break;
      case TAB_BLINKSOCKS_DESKTOP:
        ipcRenderer.send(RENDERER_QUERY_BSD_LOG);
        break;
      default:
        break;
    }
    this.setState({tabIndex: value});
    this.onToggleWatch(false);
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
        until: formatDate(selectedDates[1])
      });
      this.setState({
        filterLevel: '',
        searchKeywords: ''
      });
    }
  }

  onSearch(keywords) {
    const {orgLogs} = this.state;
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

  onToggleWatch(isForceWatch) {
    this.setState({isWatch: (typeof isForceWatch !== 'undefined') ? isForceWatch : !this.state.isWatch}, () => {
      const {tabIndex, isWatch} = this.state; // take care of the state here
      const _isWatch = (typeof isForceWatch !== 'undefined') ? isForceWatch : isWatch;
      switch (tabIndex) {
        case TAB_BLINKSOCKS:
          ipcRenderer.send(RENDERER_STREAM_BS_LOG, _isWatch);
          break;
        case TAB_BLINKSOCKS_DESKTOP:
          ipcRenderer.send(RENDERER_STREAM_BSD_LOG, _isWatch);
          break;
        default:
          break;
      }
    });
  }

  render() {
    const {tabIndex, logs, orgLogs, filterLevel, isWatch} = this.state;
    return (
      <div className="logs">
        <Tabs value={tabIndex} onChange={this.onTabChange}>
          <Tab label="blinksocks" value={TAB_BLINKSOCKS}/>
          <Tab label="blinksocks-desktop" value={TAB_BLINKSOCKS_DESKTOP}/>
        </Tabs>
        <div className="logs__toolbox">
          <div className="logs__toolbox__line">
            <LogLevelFilters level={filterLevel} onFilter={this.onFilterLevel}/>
          </div>
          <div className="logs__toolbox__line">
            <div className="logs__toolbox__range">
              <DatePicker
                disabled={isWatch}
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
            <input
              type="text"
              className="logs__toolbox__search"
              placeholder={`Search anything from ${logs.length} records`}
              onClick={(e) => e.target.select()}
              onChange={(e) => this.onSearch(e.target.value)}
            />
            <label className="logs__toolbox__watch">
              <input type="checkbox" checked={isWatch} onChange={this.onToggleWatch}/>
              <span>watch</span>
            </label>
            <div className="logs__toolbox__results">
              <span>{logs.length}/{orgLogs.length}</span>
              <label>results</label>
            </div>
          </div>
        </div>
        <LogItems logs={logs}/>
      </div>
    );
  }

}
