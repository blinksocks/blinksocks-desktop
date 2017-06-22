import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {List, Subheader} from 'material-ui';
import './ServerList.css';

export class ServerList extends Component {

  static propTypes = {
    servers: PropTypes.array,
    children: PropTypes.func
  };

  static defaultProps = {
    servers: [],
    children: (/* server, i */) => {
    }
  };

  render() {
    const {servers, children} = this.props;
    return (
      <List className="serverlist">
        <Subheader>
          Servers({`total: ${servers.length} active: ${servers.filter((s) => s.enabled).length}`})
        </Subheader>
        <div className="serverlist__servers">
          {servers.map((server, i) => children(server, i))}
        </div>
      </List>
    );
  }

}
