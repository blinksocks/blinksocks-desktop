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
  RENDERER_CREATE_QR_CODE,
  RENDERER_COPY_QR_CODE_AS_IMAGE,
  RENDERER_COPY_QR_CODE_AS_TEXT,
  MAIN_INIT,
  MAIN_ERROR,
  MAIN_START_BS,
  MAIN_START_PAC,
  MAIN_STOP_BS,
  MAIN_STOP_PAC,
  MAIN_SET_SYS_PAC,
  MAIN_CREATE_QR_CODE,
  MAIN_COPY_QR_CODE_AS_IMAGE,
  MAIN_COPY_QR_CODE_AS_TEXT
} from '../../defs/events';

import {toast} from '../../helpers';
import {isPresetsCompatibleToSS} from '../../defs/presets';
import {PopupDialog, ScreenMask, ServerItem} from '../../components';
import {AppSlider, General, ServerList, ClientEditor, PacEditor, ServerEditor, QRCode} from '../../containers';
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
    qrcodes: {
      // [name]: <dataURL>
    },
    isOpenDrawer: false,
    isOpenClientDialog: false,
    isOpenPacDialog: false,
    isOpenServerDialog: false,
    isOpenQRCodeDialog: false
  };

  constructor(props) {
    super(props);
    this.onMenuTouchTap = this.onMenuTouchTap.bind(this);
    this.onPreviewHistory = this.onPreviewHistory.bind(this);
    this.onBeginAddServer = this.onBeginAddServer.bind(this);
    this.onBeginEditServer = this.onBeginEditServer.bind(this);
    this.onBeginCreateQRCode = this.onBeginCreateQRCode.bind(this);
    this.onBeginEditClient = this.onBeginEditClient.bind(this);
    this.onBeginEditPAC = this.onBeginEditPAC.bind(this);
    this.onEditedServer = this.onEditedServer.bind(this);
    this.onEditedClient = this.onEditedClient.bind(this);
    this.onEditedPac = this.onEditedPac.bind(this);
    this.onToggleLocalService = this.onToggleLocalService.bind(this);
    this.onToggleServer = this.onToggleServer.bind(this);
    this.onTogglePac = this.onTogglePac.bind(this);
    this.onCopyQRCodeAsText = this.onCopyQRCodeAsText.bind(this);
    this.onCopyQRCodeAsImage = this.onCopyQRCodeAsImage.bind(this);
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
    ipcRenderer.on(MAIN_CREATE_QR_CODE, (event, {name, dataURL}) => {
      this.setState({qrcodes: {...this.state.qrcodes, ...{[name]: dataURL}}});
    });
    ipcRenderer.on(MAIN_COPY_QR_CODE_AS_TEXT, () => {
      toast('QR code copied to clipboard');
    });
    ipcRenderer.on(MAIN_COPY_QR_CODE_AS_IMAGE, () => {
      toast('QR code copied to clipboard');
    });
  }

  componentWillUnmount() {
    this.onStopApp();
  }

  // left drawer

  onMenuTouchTap() {
    this.setState({isOpenDrawer: !this.state.isOpenDrawer});
  }

  // right history

  onPreviewHistory() {
    ipcRenderer.send(RENDERER_PREVIEW_LOGS);
  }

  // open corresponding dialog

  onBeginAddServer() {
    this.setState({isOpenServerDialog: true, serverIndex: -1});
  }

  onBeginEditServer(i) {
    this.setState({isOpenServerDialog: true, serverIndex: i});
  }

  onBeginCreateQRCode(i) {
    const {host, port, servers} = this.state.config;
    const {key, presets, remarks} = servers[i];

    ipcRenderer.send(RENDERER_CREATE_QR_CODE, {
      name: 'blinksocks QR code',
      message: `bs://${btoa(JSON.stringify(servers[i]))}`
    });

    if (isPresetsCompatibleToSS(presets)) {
      const method = presets[1].params.method;
      ipcRenderer.send(RENDERER_CREATE_QR_CODE, {
        name: 'shadowsocks compatible',
        message: encodeURI(`ss://${btoa(`${method}:${key}@${host}:${port}?remarks=${remarks}`)}`)
      });
    }

    this.setState({
      isOpenQRCodeDialog: true,
      serverIndex: i,
      qrcodes: {}
    });
  }

  onBeginEditClient() {
    this.setState({isOpenClientDialog: true});
  }

  onBeginEditPAC() {
    this.setState({isOpenPacDialog: true});
  }

  // once settings confirmed

  onEditedServer() {
    this.setState({isOpenServerDialog: false}, this.onRestartApp);
  }

  onEditedClient() {
    this.setState({isOpenClientDialog: false}, this.onRestartApp);
  }

  onEditedPac() {
    this.setState({isOpenPacDialog: false}, this.onRestartApp);
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

  // qrcode

  onCopyQRCodeAsText(name) {
    ipcRenderer.send(RENDERER_COPY_QR_CODE_AS_TEXT, {name});
  }

  onCopyQRCodeAsImage(name) {
    ipcRenderer.send(RENDERER_COPY_QR_CODE_AS_IMAGE, {name});
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
    const {version, pacLastUpdatedAt, config} = this.state;
    const {appStatus, pacStatus, serverIndex, qrcodes} = this.state;
    const {isOpenDrawer} = this.state;
    const {isOpenClientDialog, isOpenServerDialog, isOpenPacDialog, isOpenQRCodeDialog} = this.state;

    if (config === null) {
      return (
        <div className="app__loading">Loading</div>
      );
    }

    const server = config.servers[serverIndex];

    return (
      <div className="app">
        {isOpenDrawer && <ScreenMask onTouchTap={this.onMenuTouchTap}/>}
        <AppBar
          title="blinksocks"
          onLeftIconButtonTouchTap={this.onMenuTouchTap}
          iconElementRight={<IconButton onTouchTap={this.onPreviewHistory}><ActionHistory/></IconButton>}
        />
        <AppSlider isOpen={isOpenDrawer} version={version} pacLastUpdatedAt={pacLastUpdatedAt}/>
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
        <ServerList servers={config.servers}>
          {(server, i) => (
            <ServerItem
              key={i}
              server={server}
              onToggleEnabled={this.onToggleServer.bind(this, i)}
              onEdit={this.onBeginEditServer.bind(this, i)}
              onCreateQRCode={this.onBeginCreateQRCode.bind(this, i)}
              onDelete={this.onDeleteServer.bind(this, i)}
            />
          )}
        </ServerList>
        <PopupDialog
          title="BLINKSOCKS CLIENT"
          isOpen={isOpenClientDialog}
          onConfirm={this.onEditedClient}
          onCancel={() => this.setState({isOpenClientDialog: false})}>
          <ClientEditor config={config} onEdit={this.onEditingLocal}/>
        </PopupDialog>
        <PopupDialog
          title="Proxy Auto Config (PAC)"
          isOpen={isOpenPacDialog}
          onConfirm={this.onEditedPac}
          onCancel={() => this.setState({isOpenPacDialog: false})}>
          <PacEditor config={config} onEdit={this.onEditingLocal}/>
        </PopupDialog>
        <PopupDialog
          title={`${server ? 'EDIT' : 'ADD'} A SERVER`}
          isOpen={isOpenServerDialog}
          onConfirm={this.onEditedServer}
          onCancel={() => this.setState({isOpenServerDialog: false})}>
          <ServerEditor
            server={server || DEFAULT_CONFIG_STRUCTURE.servers[0]}
            onEdit={this.onEditingServer}
          />
        </PopupDialog>
        <PopupDialog
          title={server ? `QR code for "${server.remarks}"` : 'QR code'}
          isOpen={isOpenQRCodeDialog}
          onCancel={() => this.setState({isOpenQRCodeDialog: false})}>
          <QRCode
            qrcodes={qrcodes}
            onCopyText={this.onCopyQRCodeAsText}
            onCopyImage={this.onCopyQRCodeAsImage}
          />
        </PopupDialog>
      </div>
    );
  }

}
