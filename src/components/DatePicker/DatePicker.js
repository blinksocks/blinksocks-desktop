import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import './DatePicker.css';

/**
 * A React wrapper for flatpickr
 */
export class DatePicker extends Component {

  static propTypes = {
    flatpickrOptions: PropTypes.object
  };

  static defaultProps = {
    flatpickrOptions: {}
  };

  $datePicker = null;

  componentDidMount() {
    const {flatpickrOptions, onChange} = this.props;
    new Flatpickr(this.$datePicker, {
      onChange,
      ...flatpickrOptions
    });
  }

  render() {
    return (
      <input className="datepicker" ref={(dom) => this.$datePicker = dom}/>
    );
  }

}
