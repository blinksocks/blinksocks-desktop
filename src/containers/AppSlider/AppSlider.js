import React, {Component} from 'react';
import PropTypes from 'prop-types';
import marked from 'marked';
import dateFormat from 'date-fns/format';
import filesize from 'filesize';
import 'github-markdown-css';

import {
  MAIN_UPDATE_PAC,
  MAIN_UPDATE_PAC_FAIL,
  MAIN_UPDATE_SELF,
  MAIN_UPDATE_SELF_PROGRESS,
  MAIN_UPDATE_SELF_FAIL,
  RENDERER_UPDATE_PAC,
  RENDERER_UPDATE_SELF,
  RENDERER_UPDATE_SELF_CANCEL,
  RENDERER_QUIT
} from '../../defs/events';

import {
  Dialog,
  Drawer,
  ListItem,
  FlatButton,
  Divider
} from 'material-ui';

import {ActionHelpOutline, ActionExitToApp} from 'material-ui/svg-icons';

import {toast} from '../../helpers';

import './AppSlider.css';
import GithubSvg from './github.svg';

const {ipcRenderer} = window.require('electron');

const links = [{
  text: 'Quit',
  icon: <ActionExitToApp style={{transform: 'rotate(180deg)'}}/>,
  onClick: () => ipcRenderer.send(RENDERER_QUIT)
}, {
  text: 'Issues',
  icon: <ActionHelpOutline/>,
  href: 'https://github.com/blinksocks/blinksocks-desktop/issues'
}, {
  text: 'Github',
  icon: <img src={GithubSvg} alt="Github" style={{transform: 'scale(.85)'}}/>,
  href: 'https://github.com/blinksocks/blinksocks-desktop'
}];

const PACKAGE_JSON_URL = 'https://raw.githubusercontent.com/blinksocks/blinksocks-desktop/master/package.json';
const CHANGELOG_URL = 'https://raw.githubusercontent.com/blinksocks/blinksocks-desktop/master/CHANGELOG.md';
const RELEASES_URL = 'https://github.com/blinksocks/blinksocks-desktop/releases';

export class AppSlider extends Component {

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    version: PropTypes.string.isRequired,
    pacLastUpdatedAt: PropTypes.number.isRequired
  };

  state = {
    isCheckingUpdates: false,
    isUpdatingPac: false,
    isUpdatingSelf: false,
    latestPackageJson: null,
    latestChangelog: '',
    pacLastUpdatedAt: this.props.pacLastUpdatedAt,
    selfUpdatingPercentage: 0,
    selfUpdatingTotalBytes: 0,
    isUpdateDialogShow: false
  };

  constructor(props) {
    super(props);
    this.onCheckUpdates = this.onCheckUpdates.bind(this);
    this.onUpdateAndRestart = this.onUpdateAndRestart.bind(this);
    this.onFullDownload = this.onFullDownload.bind(this);
    this.onCancelUpdateSelf = this.onCancelUpdateSelf.bind(this);
    this.onUpdatePac = this.onUpdatePac.bind(this);
  }

  componentDidMount() {
    ipcRenderer.on(MAIN_UPDATE_PAC, (e, timestamp) => {
      this.setState({isUpdatingPac: false, pacLastUpdatedAt: timestamp});
    });
    ipcRenderer.on(MAIN_UPDATE_PAC_FAIL, (e, message) => {
      this.setState({isUpdatingPac: false});
      toast(message, {stay: true});
    });
    ipcRenderer.on(MAIN_UPDATE_SELF_PROGRESS, (e, {percentage, totalBytes}) => {
      this.setState({selfUpdatingPercentage: percentage, selfUpdatingTotalBytes: totalBytes});
    });
    ipcRenderer.on(MAIN_UPDATE_SELF, () => {
      this.setState({isUpdatingSelf: false, isUpdateDialogShow: false});
    });
    ipcRenderer.on(MAIN_UPDATE_SELF_FAIL, (e, message) => {
      this.setState({isUpdatingSelf: false, selfUpdatingPercentage: 0});
      toast(message, {stay: true});
    });
  }

  async onCheckUpdates() {
    const {version} = this.props;
    const {isCheckingUpdates} = this.state;

    if (!isCheckingUpdates) {
      this.setState({isCheckingUpdates: true});
      try {
        // 1. fetch package.json
        const packageJsonResponse = await fetch(PACKAGE_JSON_URL);
        const packageJson = JSON.parse(await packageJsonResponse.text());
        const isUpdateDialogShow = (version !== packageJson.version);

        // 2. fetch CHANGELOG.md
        const changelogResponse = await fetch(CHANGELOG_URL);
        const changelog = marked(await changelogResponse.text());

        this.setState({
          isCheckingUpdates: false,
          latestPackageJson: packageJson,
          latestChangelog: changelog,
          isUpdateDialogShow
        });
      } catch (err) {
        toast(err.message);
        this.setState({
          isCheckingUpdates: false,
          latestPackageJson: null,
          latestChangelog: '',
          isUpdateDialogShow: false
        });
      }
    }
  }

  onUpdateAndRestart() {
    const {latestPackageJson: {version}} = this.state;
    this.setState({isUpdatingSelf: true});
    ipcRenderer.send(RENDERER_UPDATE_SELF, {version});
  }

  onFullDownload() {
    window.open(RELEASES_URL);
  }

  onCancelUpdateSelf() {
    this.setState({isUpdateDialogShow: false, isUpdatingSelf: false});
    ipcRenderer.send(RENDERER_UPDATE_SELF_CANCEL);
  }

  onUpdatePac() {
    this.setState({isUpdatingPac: true});
    ipcRenderer.send(RENDERER_UPDATE_PAC);
  }

  getVersionText() {
    const {version} = this.props;
    const {isCheckingUpdates, latestPackageJson} = this.state;
    let dynamic = '';
    if (isCheckingUpdates) {
      dynamic = '? fetching...';
    } else {
      if (latestPackageJson !== null) {
        if (latestPackageJson.version === version) {
          dynamic = `= v${latestPackageJson.version}(latest)`;
        } else {
          dynamic = `-> v${latestPackageJson.version}(latest)`;
        }
      }
    }
    return `Version: v${version} ${dynamic}`;
  }

  getPacDateTimeText() {
    const {isUpdatingPac, pacLastUpdatedAt} = this.state;
    if (isUpdatingPac) {
      return 'updating...';
    }
    if (pacLastUpdatedAt !== 0) {
      return 'Last Updated: ' + dateFormat(pacLastUpdatedAt, 'YYYY/MM/DD HH:mm');
    }
    return 'Last Updated: -';
  }

  render() {
    const {isOpen} = this.props;
    const {
      isUpdateDialogShow,
      isUpdatingPac,
      isUpdatingSelf,
      latestPackageJson,
      latestChangelog,
      selfUpdatingPercentage,
      selfUpdatingTotalBytes
    } = this.state;
    return (
      <Drawer className="appslider" open={isOpen}>
        <section className="appslider__header">
          <img className="appslider__header__logo" alt="blinksocks" src="./assets/images/icon.png"/>
          <h4>blinksocks</h4>
        </section>
        <ListItem
          primaryText="Check for Updates"
          secondaryText={this.getVersionText()}
          onTouchTap={this.onCheckUpdates}
        />
        <ListItem
          disabled={isUpdatingPac}
          primaryText="Update PAC from GFWLIST"
          secondaryText={this.getPacDateTimeText()}
          onTouchTap={this.onUpdatePac}
        />
        <Divider/>
        <div className="appslider__footer">
          {links.map(({text, icon, href, onClick}, i) => (
            <p key={i} className="appslider__footer__item" onClick={onClick ? onClick : () => window.open(href)}>
              {icon}<span>{text}</span>
            </p>
          ))}
        </div>
        <Dialog
          open={isUpdateDialogShow}
          title={`VERSION ${latestPackageJson && latestPackageJson.version} IS AVAILABLE`}
          actions={[
            <FlatButton
              primary
              label={isUpdatingSelf ? `UPDATING...${(selfUpdatingPercentage * 100).toFixed(2)}% OF ${filesize(selfUpdatingTotalBytes)}` : 'UPDATE & RESTART'}
              onTouchTap={this.onUpdateAndRestart}
              disabled={isUpdatingSelf}
            />,
            <FlatButton primary label="FULL DOWNLOAD" onTouchTap={this.onFullDownload}/>,
            <FlatButton label="CANCEL" onTouchTap={this.onCancelUpdateSelf}/>
          ]}
          autoScrollBodyContent={true}
        >
          <div
            className="markdown-body"
            style={{fontSize: '.85rem', padding: '5px 0'}}
            dangerouslySetInnerHTML={{__html: latestChangelog}}
          />
        </Dialog>
      </Drawer>
    );
  }

}
