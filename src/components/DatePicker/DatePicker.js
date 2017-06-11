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
    flatpickrOptions: PropTypes.object,
    disabled: PropTypes.bool
  };

  static defaultProps = {
    flatpickrOptions: {},
    disabled: false
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
    const {disabled} = this.props;
    return (
      <input disabled={disabled} className="datepicker" ref={(dom) => this.$datePicker = dom}/>
    );
  }

}
