import React, {Component} from 'react';
import {AppBar, Divider, IconButton} from 'material-ui';
import {ActionHistory} from 'material-ui/svg-icons';

import {DEFAULT_CONFIG_STRUCTURE} from '../../defs/bs-config-template';

import {
  RENDERER_INIT,
  RENDERER_START_BS,
  RENDERER_STOP_BS,
  RENDERER_START_PAC,
  RENDERER_STOP_PAC,
  RENDERER_SAVE_CONFIG,
  RENDERER_SET_SYS_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY,
  RENDERER_PREVIEW_LOGS,
  MAIN_INIT,
  MAIN_ERROR,
  MAIN_START_BS,
  MAIN_START_PAC,
  MAIN_STOP_BS,
  MAIN_STOP_PAC,
  MAIN_SET_SYS_PAC
} from '../../defs/events';

import {toast} from '../../helpers';
import {ScreenMask, ServerItem} from '../../components';
import {ClientDialog, PacDialog, ServerDialog} from '../../dialogs';
import {AppSlider, General, ServerList} from '../../containers';
import './App.css';

const {ipcRenderer} = window.require('electron');

const STATUS_OFF = 0;
const STATUS_RUNNING = 1;
// const STATUS_STARTING = 2;
const STATUS_RESTARTING = 3;

export class App extends Component {

  state = {
    version: '0.0.0',
    pacLastUpdatedAt: 0,
    config: null,
    appStatus: STATUS_OFF,
    pacStatus: STATUS_OFF,
    serverIndex: -1,
    isDisplayDrawer: false,
    isDisplayClientEditor: false,
    isDisplayPACEditor: false,
    isDisplayServerEditor: false
  };

  constructor(props) {
    super(props);
    this.onMenuTouchTap = this.onMenuTouchTap.bind(this);
    this.onPreviewHistory = this.onPreviewHistory.bind(this);
    this.onBeginAddServer = this.onBeginAddServer.bind(this);
    this.onBeginEditServer = this.onBeginEditServer.bind(this);
    this.onBeginEditClient = this.onBeginEditClient.bind(this);
    this.onBeginEditPAC = this.onBeginEditPAC.bind(this);
    this.onEditedServer = this.onEditedServer.bind(this);
    this.onEditedClient = this.onEditedClient.bind(this);
    this.onEditedPac = this.onEditedPac.bind(this);
    this.onToggleLocalService = this.onToggleLocalService.bind(this);
    this.onToggleServer = this.onToggleServer.bind(this);
    this.onTogglePac = this.onTogglePac.bind(this);
    this.onEditingServer = this.onEditingServer.bind(this);
    this.onEditingLocal = this.onEditingLocal.bind(this);
    this.onDeleteServer = this.onDeleteServer.bind(this);
    this.onStartApp = this.onStartApp.bind(this);
    this.onStopApp = this.onStopApp.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  // react component hooks

  componentDidMount() {
    ipcRenderer.send(RENDERER_INIT);
    ipcRenderer.on(MAIN_INIT, (event, {version, config, pacLastUpdatedAt}) => {
      this.setState({
        version,
        pacLastUpdatedAt,
        config,
        appStatus: config.app_status,
        pacStatus: config.pac_status
      });
    });
    ipcRenderer.on(MAIN_ERROR, (event, err) => {
      if (typeof err === 'object') {
        toast(`Error: ${JSON.stringify(err)}`);
      }
      if (typeof err === 'string') {
        toast(`Error: ${err}`);
      }
      console.warn(err);
    });
    ipcRenderer.on(MAIN_START_BS, () => {
      const {config} = this.state;
      this.setState({
        config: {
          ...config,
          app_status: STATUS_RUNNING
        },
        appStatus: STATUS_RUNNING
      }, this.onSave);
    });
    ipcRenderer.on(MAIN_START_PAC, () => {
      const {config} = this.state;
      this.setState({
        config: {
          ...config,
          pac_status: STATUS_RUNNING
        },
        pacStatus: STATUS_RUNNING
      }, this.onSave);
    });
    ipcRenderer.on(MAIN_STOP_BS, () => {
      const {config} = this.state;
      this.setState({
        config: {
          ...config,
          app_status: STATUS_OFF
        },
        appStatus: STATUS_OFF
      }, this.onSave);
    });
    ipcRenderer.on(MAIN_STOP_PAC, () => {
      const {config} = this.state;
      this.setState({
        config: {
          ...config,
          pac_status: STATUS_OFF
        },
        pacStatus: STATUS_OFF
      }, this.onSave);
    });
    ipcRenderer.on(MAIN_SET_SYS_PAC, () => {
      const {config} = this.state;
      this.setState({
        config: {
          ...config,
          pac_status: STATUS_RUNNING
        },
        pacStatus: STATUS_RUNNING
      }, this.onSave);
    });
  }

  componentWillUnmount() {
    this.onStopApp();
  }

  // left drawer

  onMenuTouchTap() {
    this.setState({isDisplayDrawer: !this.state.isDisplayDrawer});
  }

  // right history

  onPreviewHistory() {
    ipcRenderer.send(RENDERER_PREVIEW_LOGS);
  }

  // open corresponding dialog

  onBeginAddServer() {
    this.setState({isDisplayServerEditor: true, serverIndex: -1});
  }

  onBeginEditServer(index) {
    this.setState({isDisplayServerEditor: true, serverIndex: index});
  }

  onBeginEditClient() {
    this.setState({isDisplayClientEditor: true});
  }

  onBeginEditPAC() {
    this.setState({isDisplayPACEditor: true});
  }

  // once settings confirmed

  onEditedServer() {
    this.setState({isDisplayServerEditor: false}, this.onRestartApp);
  }

  onEditedClient() {
    this.setState({isDisplayClientEditor: false}, this.onRestartApp);
  }

  onEditedPac() {
    this.setState({isDisplayPACEditor: false}, this.onRestartApp);
  }

  onDeleteServer(index) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        servers: config.servers.filter((s, i) => i !== index)
      }
    }, this.onRestartApp);
  }

  // toggles

  onToggleLocalService() {
    const {appStatus} = this.state;
    if (appStatus === STATUS_RUNNING) {
      this.onStopApp();
    } else {
      this.onStartApp();
    }
  }

  onToggleServer(index) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        servers: config.servers.map((s, i) => ({
          ...s,
          enabled: (i === index) ? !s.enabled : s.enabled
        }))
      }
    }, this.onRestartApp);
  }

  onTogglePac() {
    const {appStatus, pacStatus} = this.state;
    if (pacStatus === STATUS_RUNNING) {
      ipcRenderer.send(RENDERER_STOP_PAC);
    } else {
      const {host, port, pac_type, pac_host, pac_port, pac_custom_rules} = this.state.config;
      ipcRenderer.send(RENDERER_START_PAC, {
        type: pac_type,
        host: pac_host,
        port: pac_port,
        proxyHost: host,
        proxyPort: port,
        customRules: pac_custom_rules
      });
    }
    if (appStatus === STATUS_RUNNING) {
      this.onRestartApp();
    }
  }

  // private functions

  onSave() {
    const {config, appStatus, pacStatus} = this.state;
    if (config !== null) {
      ipcRenderer.send(RENDERER_SAVE_CONFIG, {
        ...config,
        app_status: appStatus,
        pac_status: pacStatus
      });
    }
  }

  onStartApp() {
    const {appStatus, pacStatus, config} = this.state;
    if (appStatus === STATUS_OFF && appStatus !== STATUS_RESTARTING) {
      // 1. set pac or global proxy and bypass
      if (pacStatus === STATUS_RUNNING) {
        ipcRenderer.send(RENDERER_SET_SYS_PAC, {url: this.getPacUrl()});
      } else {
        ipcRenderer.send(RENDERER_SET_SYS_PROXY, {
          host: config.host,
          port: config.port,
          bypass: config.bypass
        });
      }
      // 2. start blinksocks client
      ipcRenderer.send(RENDERER_START_BS, {config});
    }
  }

  onStopApp() {
    const {appStatus, config} = this.state;
    if (appStatus === STATUS_RUNNING) {
      // 1. restore all system settings
      ipcRenderer.send(RENDERER_RESTORE_SYS_PAC, {url: this.getPacUrl()});
      ipcRenderer.send(RENDERER_RESTORE_SYS_PROXY, {
        host: config.host,
        port: config.port,
        bypass: config.bypass
      });
      // 2. terminate blinksocks client
      ipcRenderer.send(RENDERER_STOP_BS);
    }
  }

  onRestartApp() {
    const {appStatus} = this.state;
    if (appStatus === STATUS_RUNNING) {
      this.onStopApp();
      this.setState({appStatus: STATUS_RESTARTING});
      setTimeout(this.onStartApp, 1000);
    } else {
      this.onSave();
    }
  }

  getPacUrl() {
    const {pac_type, pac_host, pac_port, pac_remote_url} = this.state.config;
    return pac_type === 0 ? `http://${pac_host || 'localhost'}:${pac_port || 1090}` : (pac_remote_url || '');
  }

  // state updater

  onEditingServer(server) {
    const {config, serverIndex} = this.state;
    if (serverIndex === -1) {
      // add a server
      this.setState({
        serverIndex: config.servers.length,
        config: {
          ...config,
          servers: config.servers.concat(server)
        }
      });
    } else {
      // edit a server
      this.setState({
        config: {
          ...config,
          servers: config.servers.map((s, i) => (i === serverIndex) ? server : s)
        }
      });
    }
  }

  onEditingLocal(newConfig) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        ...newConfig
      }
    });
  }

  render() {
    const {
      version,
      pacLastUpdatedAt,
      config,
      serverIndex,
      appStatus,
      pacStatus,
      isDisplayDrawer,
      isDisplayClientEditor,
      isDisplayServerEditor,
      isDisplayPACEditor
    } = this.state;

    if (config === null) {
      return (
        <div className="app__loading">Loading</div>
      );
    }

    return (
      <div className="app">
        {isDisplayDrawer && <ScreenMask onTouchTap={this.onMenuTouchTap}/>}
        <AppBar
          title="blinksocks"
          onLeftIconButtonTouchTap={this.onMenuTouchTap}
          iconElementRight={<IconButton onTouchTap={this.onPreviewHistory}><ActionHistory/></IconButton>}
        />
        <AppSlider isOpen={isDisplayDrawer} version={version} pacLastUpdatedAt={pacLastUpdatedAt}/>
        <General
          config={config}
          appStatus={appStatus}
          pacStatus={pacStatus}
          onToggleClientService={this.onToggleLocalService}
          onTogglePacService={this.onTogglePac}
          onOpenClientDialog={this.onBeginEditClient}
          onOpenPacDialog={this.onBeginEditPAC}
          onOpenServerDialog={this.onBeginAddServer}
        />
        <Divider/>
        <ServerList
          servers={config.servers}
          getItemComponent={(server, i) => (
            <ServerItem
              key={i}
              server={server}
              onToggleEnabled={this.onToggleServer.bind(this, i)}
              onEdit={this.onBeginEditServer.bind(this, i)}
              onDelete={this.onDeleteServer.bind(this, i)}
            />
          )}
        />
        <ClientDialog
          isOpen={isDisplayClientEditor}
          config={config}
          onUpdate={this.onEditingLocal}
          onConfirm={this.onEditedClient}
          onCancel={() => this.setState({isDisplayClientEditor: false})}
        />
        <PacDialog
          isOpen={isDisplayPACEditor}
          config={config}
          onUpdate={this.onEditingLocal}
          onConfirm={this.onEditedPac}
          onCancel={() => this.setState({isDisplayPACEditor: false})}
        />
        <ServerDialog
          isOpen={isDisplayServerEditor}
          server={config.servers[serverIndex] || DEFAULT_CONFIG_STRUCTURE.servers[0]}
          serverIndex={serverIndex}
          onUpdate={this.onEditingServer}
          onConfirm={this.onEditedServer}
          onCancel={() => this.setState({isDisplayServerEditor: false})}
        />
      </div>
    );
  }

}
