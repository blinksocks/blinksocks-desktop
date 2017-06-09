import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route} from 'react-router-dom';
import {MuiThemeProvider, getMuiTheme} from 'material-ui/styles';
import injectTapEventPlugin from 'react-tap-event-plugin';
import 'notie';
import 'notie/dist/notie.min.css';

import {App, Logs} from './containers';
import myTheme from './theme';
import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  // Needed for onTouchTap
  // http://stackoverflow.com/a/34015469/988941
  injectTapEventPlugin();

  ReactDOM.render(
    <MuiThemeProvider muiTheme={getMuiTheme(myTheme)}>
      <HashRouter>
        <div>
          <Route path="/main" component={App}/>
          <Route path="/logs" component={Logs}/>
        </div>
      </HashRouter>
    </MuiThemeProvider>,
    document.getElementById('root')
  );
});
