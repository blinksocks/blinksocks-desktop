import React, {Component} from 'react';
import notie from 'notie';
import {AppBar, Divider} from 'material-ui';

import {DEFAULT_CONFIG_STRUCTURE} from '../../../../common/bs-config-template';

import {
  RENDERER_INIT,
  RENDERER_TERMINATE,
  RENDERER_START_BS,
  RENDERER_TERMINATE_BS,
  RENDERER_START_PAC,
  RENDERER_TERMINATE_PAC,
  RENDERER_SAVE_CONFIG,
  RENDERER_SET_SYS_PAC,
  RENDERER_SET_SYS_PROXY,
  RENDERER_SET_SYS_PROXY_BYPASS,
  RENDERER_RESTORE_SYS_PAC,
  RENDERER_RESTORE_SYS_PROXY,
  RENDERER_RESTORE_SYS_PROXY_BYPASS,
  MAIN_INIT,
  MAIN_ERROR,
  MAIN_TERMINATE,
} from '../../../../common/events';

import {ScreenMask, ServerItem} from '../../components';
import {ClientDialog, PacDialog, ServerDialog} from '../../dialogs';
import {AppSlider, General, ServerList} from '../../containers';
import './App.css';

const {ipcRenderer} = window.require('electron');

const STATUS_OFF = 0;
const STATUS_RUNNING = 1;
// const STATUS_STARTING = 2;
const STATUS_RESTARTING = 3;

function toast(message) {
  notie.alert({text: message, position: 'bottom', stay: false, time: 5});
}

export class App extends Component {

  state = {
    config: null,
    appStatus: STATUS_OFF,
    pacStatus: STATUS_OFF,
    netServices: [],
    serverIndex: -1,
    isDisplayDrawer: false,
    isDisplayClientEditor: false,
    isDisplayPACEditor: false,
    isDisplayServerEditor: false
  };

  constructor(props) {
    super(props);
    this.onMenuTouchTap = this.onMenuTouchTap.bind(this);
    this.onBeginAddServer = this.onBeginAddServer.bind(this);
    this.onBeginEditServer = this.onBeginEditServer.bind(this);
    this.onBeginEditClient = this.onBeginEditClient.bind(this);
    this.onBeginEditPAC = this.onBeginEditPAC.bind(this);
    this.onCloseServerEditor = this.onCloseServerEditor.bind(this);
    this.onCloseClientEditor = this.onCloseClientEditor.bind(this);
    this.onClosePACEditor = this.onClosePACEditor.bind(this);
    this.onToggleLocalService = this.onToggleLocalService.bind(this);
    this.onToggleServerEnabled = this.onToggleServerEnabled.bind(this);
    this.onTogglePACEnabled = this.onTogglePACEnabled.bind(this);
    this.onEditServer = this.onEditServer.bind(this);
    this.onEditClient = this.onEditClient.bind(this);
    this.onDeleteServer = this.onDeleteServer.bind(this);
    this.onStartApp = this.onStartApp.bind(this);
    this.onStopApp = this.onStopApp.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onSaveAndRestart = this.onSaveAndRestart.bind(this);
  }

  componentDidMount() {
    ipcRenderer.send(RENDERER_INIT);
    ipcRenderer.on(MAIN_INIT, (event, {config, services}) => {
      this.setState({
        config,
        appStatus: config.app_status,
        pacStatus: config.pac_status,
        netServices: services
      });
    });
    ipcRenderer.on(MAIN_ERROR, (event, err) => {
      switch (err.code) {
        case 'EADDRINUSE':
          this.setState({appStatus: STATUS_OFF});
          toast(`Error: ${err.code} ${err.address}:${err.port}`);
          break;
        default:
          toast(`Error: ${err}`);
          break;
      }
      console.warn(err);
    });
    ipcRenderer.on(MAIN_TERMINATE, () => {
      this.onStopApp();
      ipcRenderer.send(RENDERER_TERMINATE);
    });
  }

  componenetWillUnmont() {
    this.onStopApp();
  }

  onMenuTouchTap() {
    this.setState({isDisplayDrawer: !this.state.isDisplayDrawer});
  }

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

  onCloseServerEditor() {
    this.setState({isDisplayServerEditor: false}, this.onSaveAndRestart);
  }

  onCloseClientEditor() {
    this.setState({isDisplayClientEditor: false}, this.onSaveAndRestart);
  }

  onClosePACEditor() {
    this.setState({isDisplayPACEditor: true});
  }

  onToggleLocalService() {
    const {appStatus} = this.state;
    if (appStatus === STATUS_RUNNING) {
      this.onStopApp();
    } else {
      this.onStartApp();
    }
  }

  onToggleServerEnabled(index) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        servers: config.servers.map((s, i) => ({
          ...s,
          enabled: (i === index) ? !s.enabled : s.enabled
        }))
      }
    }, this.onSaveAndRestart);
  }

  onTogglePACEnabled() {
    const {config, pacStatus} = this.state;

    if (pacStatus === STATUS_RUNNING) {
      this.setState({
        config: {
          ...config,
          pac_status: STATUS_OFF
        }
      }, this.onSave);
    } else {

    }
    // this.setState({
    //   config: {
    //     ...config,
    //     pac_status: !config.pac_on
    //   }
    // }, this.onSaveAndRestart);
  }

  onEditServer(server) {
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

  onEditClient(newConfig) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        ...newConfig
      }
    });
  }

  onDeleteServer(index) {
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        servers: config.servers.filter((s, i) => i !== index)
      }
    }, this.onSaveAndRestart);
  }

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

  onSaveAndRestart() {
    this.onSave();
    this.onRestartApp();
  }

  onStartApp() {
    const {appStatus, config, netServices} = this.state;
    if (appStatus === STATUS_OFF || appStatus === STATUS_RESTARTING) {
      // validate config
      if (config.servers.filter((server) => server.enabled).length < 1) {
        toast('You must enable at least one server');
        this.setState({appStatus: STATUS_OFF});
        return;
      }

      // TODO: validate other settings

      try {
        // 1. set system proxy and bypass
        const service = netServices[0];
        if (config.pac_on) {
          ipcRenderer.send(RENDERER_SET_SYS_PROXY, service, {
            enabled: false
          });
          ipcRenderer.send(RENDERER_SET_SYS_PAC, service, {
            enabled: true,
            url: config.pac
          });
        } else {
          ipcRenderer.send(RENDERER_SET_SYS_PAC, service, {
            enabled: false
          });
          ipcRenderer.send(RENDERER_SET_SYS_PROXY, service, {
            enabled: true,
            host: config.host,
            port: config.port
          });
        }
        ipcRenderer.send(RENDERER_SET_SYS_PROXY_BYPASS, service, {
          bypass: config.bypass
        });

        // 2. start blinksocks client
        ipcRenderer.send(RENDERER_START_BS, config);

        // 3. update ui
        this.setState({appStatus: STATUS_RUNNING}, this.onSave);
      } catch (err) {
        console.warn(err);
        toast(err.message);
      }
    }
  }

  onStopApp() {
    const {netServices} = this.state;
    try {
      // 1. terminate blinksocks client
      ipcRenderer.send(RENDERER_TERMINATE_BS);

      // 2. restore all system settings
      const service = netServices[0];
      ipcRenderer.send(RENDERER_RESTORE_SYS_PAC, service);
      ipcRenderer.send(RENDERER_RESTORE_SYS_PROXY, service);
      ipcRenderer.send(RENDERER_RESTORE_SYS_PROXY_BYPASS, service);

      // 3. update ui
      this.setState({appStatus: STATUS_OFF}, this.onSave);
    } catch (err) {
      console.warn(err);
      toast(err.message);
    }
  }

  onRestartApp() {
    const {appStatus} = this.state;
    if (appStatus === STATUS_RUNNING) {
      this.onStopApp();
      this.setState({appStatus: STATUS_RESTARTING});
      setTimeout(this.onStartApp, 1000);
    }
  }

  onStartPAC() {
    const {pacStatus, config} = this.state;
    if (pacStatus === STATUS_OFF && pacStatus !== STATUS_RESTARTING) {
      ipcRenderer.send(RENDERER_START_PAC, config.pac);
    }
  }

  onStopPAC() {
    const {pacStatus} = this.state;
    if (pacStatus === STATUS_RUNNING) {
      ipcRenderer.send(RENDERER_TERMINATE_PAC);
    }
  }

  render() {
    const {
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
        <AppBar title="blinksocks" onLeftIconButtonTouchTap={this.onMenuTouchTap}/>
        <AppSlider isOpen={isDisplayDrawer}/>
        <General
          config={config}
          appStatus={appStatus}
          pacStatus={pacStatus}
          // onTogglePacService={}
          // onToggleClientService={}
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
              onToggleEnabled={this.onToggleServerEnabled.bind(this, i)}
              onEdit={this.onBeginEditServer.bind(this, i)}
              onDelete={this.onDeleteServer.bind(this, i)}
            />
          )}
        />
        <ClientDialog
          isOpen={isDisplayClientEditor}
          config={config}
          onUpdate={this.onEditClient}
          onConfirm={this.onCloseClientEditor}
          onCancel={() => this.setState({isDisplayClientEditor: false})}
        />
        <PacDialog
          isOpen={isDisplayPACEditor}
          config={config}
          // onConfirm={}
          onCancel={() => this.setState({isDisplayPACEditor: false})}
        />
        <ServerDialog
          isOpen={isDisplayServerEditor}
          server={config.servers[serverIndex] || DEFAULT_CONFIG_STRUCTURE.servers[0]}
          serverIndex={serverIndex}
          onUpdate={this.onEditServer}
          onConfirm={this.onCloseServerEditor}
          onCancel={() => this.setState({isDisplayServerEditor: false})}
        />
      </div>
    );
  }

}
