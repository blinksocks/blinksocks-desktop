import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {List, Subheader} from 'material-ui';

export class ServerList extends Component {

  static propTypes = {
    servers: PropTypes.array,
    getItemComponent: PropTypes.func
  };

  static defaultProps = {
    servers: [],
    getItemComponent: (/* server, i */) => {
    }
  };

  render() {
    const {servers, getItemComponent} = this.props;
    return (
      <List className="serverlist">
        <Subheader>
          Servers({`total: ${servers.length} active: ${servers.filter((s) => s.enabled).length}`})
        </Subheader>
        <div className="serverlist__servers">
          {servers.map((server, i) => getItemComponent(server, i))}
        </div>
      </List>
    );
  }

}
