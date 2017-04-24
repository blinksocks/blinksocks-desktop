import React from 'react';
import ReactDOM from 'react-dom';
import {MuiThemeProvider, getMuiTheme} from 'material-ui/styles';
import injectTapEventPlugin from 'react-tap-event-plugin';

import {App} from './containers';
import myTheme from './theme';
import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  // Needed for onTouchTap
  // http://stackoverflow.com/a/34015469/988941
  injectTapEventPlugin();

  ReactDOM.render(
    <MuiThemeProvider muiTheme={getMuiTheme(myTheme)}>
      <App/>
    </MuiThemeProvider>,
    document.getElementById('root')
  );
});
