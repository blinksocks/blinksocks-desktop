import React, {Component} from 'react';
import notie from 'notie';
import {
  AppBar,
  Dialog,
  List,
  ListItem,
  Toggle,
  FlatButton,
  Divider,
  Subheader
} from 'material-ui';

import {
  ActionPowerSettingsNew,
  ImageTransform,
  ContentAdd,
  ActionSettings
} from 'material-ui/svg-icons';

import {
  RENDERER_INIT,
  RENDERER_TERMINATE,
  RENDERER_START_BS,
  RENDERER_TERMINATE_BS,
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
} from '../../events';

import {ScreenMask, ServerItem} from '../../components';
import {AppSlider, ClientEditor, ServerEditor} from '../../containers';
import './App.css';

const {ipcRenderer} = window.require('electron');

const APP_STATUS_OFF = 0;
const APP_STATUS_RUNNING = 1;
const APP_STATUS_RESTARTING = 2;
const DEFAULT_CONFIG_STRUCTURE = {
  host: 'localhost',
  port: 1080,
  servers: [{
    enabled: false,
    remarks: 'Default Server',
    transport: 'tcp',
    host: 'example.com',
    port: 23333,
    key: '',
    presets: [{
      name: 'ss-base',
      params: {}
    }]
  }],
  timeout: 600,
  profile: false,
  watch: false,
  log_level: 'info',
  pac: 'http://localhost:1090/blinksocks.pac',
  pac_on: true,
  bypass: ['127.0.0.1', '::1', 'localhost'],
  status: APP_STATUS_OFF
};

function toast(message) {
  notie.alert({text: message, position: 'bottom', stay: false, time: 5});
}

export class App extends Component {

  state = {
    config: null,
    appStatus: APP_STATUS_OFF,
    netServices: [],
    serverIndex: -1,
    isDisplayDrawer: false,
    isDisplayClientEditor: false,
    isDisplayServerEditor: false
  };

  constructor(props) {
    super(props);
    this.onMenuTouchTap = this.onMenuTouchTap.bind(this);
    this.onBeginAddServer = this.onBeginAddServer.bind(this);
    this.onBeginEditServer = this.onBeginEditServer.bind(this);
    this.onBeginEditClient = this.onBeginEditClient.bind(this);
    this.onCloseServerEditor = this.onCloseServerEditor.bind(this);
    this.onCloseClientEditor = this.onCloseClientEditor.bind(this);
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
        appStatus: config.status,
        netServices: services
      });
    });
    ipcRenderer.on(MAIN_ERROR, (event, err) => {
      switch (err.code) {
        case 'EADDRINUSE':
          this.setState({appStatus: APP_STATUS_OFF});
          toast(`Error: ${err.code} ${err.address}:${err.port}`);
          break;
        default:
          toast(`Error: ${err.code}`);
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

  onCloseServerEditor() {
    this.setState({isDisplayServerEditor: false}, this.onSaveAndRestart);
  }

  onCloseClientEditor() {
    this.setState({isDisplayClientEditor: false}, this.onSaveAndRestart);
  }

  onToggleLocalService() {
    const {appStatus} = this.state;
    if (appStatus === APP_STATUS_RUNNING) {
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
    const {config} = this.state;
    this.setState({
      config: {
        ...config,
        pac_on: !config.pac_on
      }
    }, this.onSaveAndRestart);
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
    const {config, appStatus} = this.state;
    if (config !== null) {
      ipcRenderer.send(RENDERER_SAVE_CONFIG, {
        ...config,
        status: appStatus
      });
    }
  }

  onSaveAndRestart() {
    this.onSave();
    this.onRestartApp();
  }

  onStartApp() {
    const {appStatus, config, netServices} = this.state;
    if (appStatus === APP_STATUS_OFF || appStatus === APP_STATUS_RESTARTING) {
      // validate config
      if (config.servers.filter((server) => server.enabled).length < 1) {
        toast('You must enable at least one server');
        this.setState({appStatus: APP_STATUS_OFF});
        return;
      }

      // TODO: validate other settings

      try {
        // 1. set system proxy and bypass
        const service = netServices[0];
        if (config.pac_on) {
          ipcRenderer.send(RENDERER_SET_SYS_PAC, service, {
            url: config.pac
          });
        } else {
          ipcRenderer.send(RENDERER_SET_SYS_PROXY, service, {
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
        this.setState({appStatus: APP_STATUS_RUNNING}, this.onSave);
      } catch (err) {
        console.warn(err);
        toast(err.message);
      }
    }
  }

  onStopApp() {
    const {config, netServices} = this.state;
    try {
      // 1. terminate blinksocks client
      ipcRenderer.send(RENDERER_TERMINATE_BS);

      // 2. restore system proxy and bypass
      const service = netServices[0];
      if (config.pac_on) {
        ipcRenderer.send(RENDERER_RESTORE_SYS_PAC, service);
      } else {
        ipcRenderer.send(RENDERER_RESTORE_SYS_PROXY, service);
      }
      ipcRenderer.send(RENDERER_RESTORE_SYS_PROXY_BYPASS, service);

      // 3. update ui
      this.setState({appStatus: APP_STATUS_OFF}, this.onSave);
    } catch (err) {
      console.warn(err);
      toast(err.message);
    }
  }

  onRestartApp() {
    const {appStatus} = this.state;
    if (appStatus === APP_STATUS_RUNNING) {
      this.onStopApp();
      this.setState({appStatus: APP_STATUS_RESTARTING});
      setTimeout(this.onStartApp, 1000);
    }
  }

  render() {
    const {
      appStatus,
      isDisplayDrawer,
      isDisplayClientEditor,
      isDisplayServerEditor,
      config,
      serverIndex
    } = this.state;
    return (
      <div className="app">
        {isDisplayDrawer && <ScreenMask onTouchTap={this.onMenuTouchTap}/>}
        <AppBar title="blinksocks" onLeftIconButtonTouchTap={this.onMenuTouchTap}/>
        <AppSlider isOpen={isDisplayDrawer}/>
        <List>
          <Subheader>General</Subheader>
          <ListItem
            leftIcon={<ActionPowerSettingsNew/>}
            primaryText="Local Service"
            secondaryText={
              <span>
                ● address: {config && config.host}:{config && config.port}
                <br/>
                ● status:
                <b style={{
                  color: {
                    [APP_STATUS_OFF]: 'inherit',
                    [APP_STATUS_RUNNING]: 'green',
                    [APP_STATUS_RESTARTING]: 'orange'
                  }[appStatus]
                }}>
                  {appStatus === APP_STATUS_OFF && 'off'}
                  {appStatus === APP_STATUS_RUNNING && 'running'}
                  {appStatus === APP_STATUS_RESTARTING && 'restarting'}
                </b>
              </span>
            }
            rightToggle={
              <Toggle
                disabled={appStatus === APP_STATUS_RESTARTING}
                toggled={appStatus === APP_STATUS_RUNNING}
                onToggle={this.onToggleLocalService}
              />
            }
          />
          <ListItem
            leftIcon={<ImageTransform/>}
            primaryText="Auto Proxy(PAC Mode)"
            secondaryText="Toggle auto/global proxy"
            rightToggle={
              <Toggle
                toggled={config ? config.pac_on : false}
                onToggle={this.onTogglePACEnabled}
              />
            }
            onTouchTap={this.onStartApp}
          />
          <ListItem
            leftIcon={<ActionSettings/>}
            primaryText="SETTINGS"
            secondaryText="Local and PAC settings"
            onTouchTap={this.onBeginEditClient}
          />
          <ListItem
            leftIcon={<ContentAdd/>}
            primaryText="ADD A SERVER"
            secondaryText="Add blinksocks/shadowsocks server"
            onTouchTap={this.onBeginAddServer}
          />
        </List>
        <Divider/>
        {config ? (
          <List>
            <Subheader>
              Servers({config && `total: ${config.servers.length} active: ${config.servers.filter((s) => s.enabled).length}`})
            </Subheader>
            <div className="app__servers">
              {config.servers.map((server, i) => (
                <ServerItem
                  key={i}
                  server={server}
                  onToggleEnabled={this.onToggleServerEnabled.bind(this, i)}
                  onEdit={this.onBeginEditServer.bind(this, i)}
                  onDelete={this.onDeleteServer.bind(this, i)}
                />
              ))}
            </div>
          </List>
        ) : 'Loading Config...'}
        <Dialog
          open={isDisplayClientEditor}
          title="SETTINGS"
          actions={[
            <FlatButton primary label="OK" onTouchTap={this.onCloseClientEditor}/>,
            <FlatButton label="CANCEL" onTouchTap={() => this.setState({isDisplayClientEditor: false})}/>
          ]}
          autoScrollBodyContent={true}
        >
          {config && (
            <ClientEditor
              config={config}
              onEdit={this.onEditClient}
            />
          )}
        </Dialog>
        <Dialog
          open={isDisplayServerEditor}
          title={`${serverIndex === -1 ? 'ADD' : 'EDIT'} A SERVER`}
          actions={[
            <FlatButton primary label="OK" onTouchTap={this.onCloseServerEditor}/>,
            <FlatButton label="CANCEL" onTouchTap={() => this.setState({isDisplayServerEditor: false})}/>
          ]}
          autoScrollBodyContent={true}
        >
          {config && (
            <ServerEditor
              server={config.servers[serverIndex] || DEFAULT_CONFIG_STRUCTURE.servers[0]}
              onEdit={this.onEditServer}
            />
          )}
        </Dialog>
      </div>
    );
  }

}
