import { DatePickerHeader } from "./DatePickerHeader.js"
import { DatePickerCalendar } from "./DatePickerCalendar.js"
var _DatePickerHeader = DatePickerHeader
var _DatePickerCalendar = DatePickerCalendar
/* eslint-disable no-useless-constructor */
/* eslint-disable eqeqeq */
/* eslint-disable no-mixed-operators */

/*
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
*/

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _reactstrap = require("reactstrap");

//var _DatePickerHeader = _interopRequireDefault(require("./DatePickerHeader"));

//var _DatePickerCalendar = _interopRequireDefault(require("./DatePickerCalendar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getInstanceCount = () => {
  if (typeof window === 'object') {
    if (window._reactstrapDatePickerInstance == undefined) {
      window._reactstrapDatePickerInstance = 0;
    }

    var next = window._reactstrapDatePickerInstance + 1;
    window._reactstrapDatePickerInstance = next;
    return next;
  } else if (typeof process === 'object') {
    if (process._reactstrapDatePickerInstance == undefined) {
      process._reactstrapDatePickerInstance = 0;
    }

    var _next = process._reactstrapDatePickerInstance + 1;

    process._reactstrapDatePickerInstance = _next;
    return _next;
  } else {
    console.error("Reactstrap Date Picker cannot determine environment (it is neither browser's <window> nor Node's <process>).");
    return 1;
  }
};

export default class DatePicker extends _react.default.Component {
  constructor(props) {
    super(props);

    if (this.props.value && this.props.defaultValue) {
      throw new Error('Conflicting DatePicker properties \'value\' and \'defaultValue\'');
    }

    this._inputRef = _react.default.createRef();
    this.hiddenInputRef = _react.default.createRef();
    this.overlayContainerRef = _react.default.createRef();
    this.state = this.getInitialState();
    this.idSuffix = this.makeIdSuffix();
  }

  getInitialState() {
    var state = this.makeDateValues(this.props.value || this.props.defaultValue);

    if (this.props.weekStartsOn > 1) {
      state.dayLabels = this.props.dayLabels.slice(this.props.weekStartsOn).concat(this.props.dayLabels.slice(0, this.props.weekStartsOn));
    } else if (this.props.weekStartsOn === 1) {
      state.dayLabels = this.props.dayLabels.slice(1).concat(this.props.dayLabels.slice(0, 1));
    } else {
      state.dayLabels = this.props.dayLabels;
    }

    state.focused = false;
    state.inputFocused = false;
    state.placeholder = this.props.placeholder || this.props.dateFormat;
    state.separator = this.props.dateFormat.match(/[^A-Z]/)[0];
    return state;
  }

  makeIdSuffix() {
    // Try <id> or <name> props to determine elements' id suffix
    if (this.props.id != undefined && this.props.id != '') return this.props.id;
    if (this.props.name != undefined && this.props.name != '') return this.props.name; // If none was passed, use global vars

    var iCount = getInstanceCount();
    return iCount.toString();
  }

  get inputRef() {
    return this.props.inputRef || this._inputRef;
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.onClickOutside.bind(this));
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onClickOutside.bind(this));
  }

  onClickOutside(event) {
    event.stopPropagation();

    if (this.overlayContainerRef && this.overlayContainerRef.current && !this.overlayContainerRef.current.contains(event.target)) {
      var inputFocused = this.inputRef && this.inputRef.current && this.inputRef.current.contains(event.target);
      this.setState({
        focused: false,
        inputFocused: inputFocused
      });

      if (this.props.onBlur) {
        var _event = document.createEvent('CustomEvent');

        _event.initEvent('Change Date', true, false);

        this.hiddenInputRef.current.dispatchEvent(_event);
        this.props.onBlur(_event);
      }
    }
  }

  makeDateValues(isoString) {
    var displayDate;
    var selectedDate = isoString ? new Date("".concat(isoString.slice(0, 10), "T12:00:00.000Z")) : null;
    var minDate = this.props.minDate ? new Date("".concat(this.props.minDate.slice(0, 10), "T12:00:00.000Z")) : null;
    var maxDate = this.props.maxDate ? new Date("".concat(this.props.maxDate.slice(0, 10), "T12:00:00.000Z")) : null;
    var inputValue = isoString ? this.makeInputValueString(selectedDate) : null;

    if (selectedDate) {
      displayDate = new Date(selectedDate);
    } else {
      var today = new Date("".concat(new Date().toISOString().slice(0, 10), "T12:00:00.000Z"));

      if (minDate && Date.parse(minDate) >= Date.parse(today)) {
        displayDate = minDate;
      } else if (maxDate && Date.parse(maxDate) <= Date.parse(today)) {
        displayDate = maxDate;
      } else {
        displayDate = today;
      }
    }

    let value = selectedDate
    try {
      value = selectedDate.toISOString()
    } catch(e) {
    }
    return {
      //value: selectedDate ? selectedDate.toISOString() : null,
      value: value,
      displayDate: displayDate,
      selectedDate: selectedDate,
      inputValue: inputValue
    };
  }

  clear() {
    if (this.props.onClear) {
      this.props.onClear();
    } else {
      this.setState(this.makeDateValues(null));
    }

    if (this.props.onChange) {
      this.props.onChange(null, null);
    }
  }

  handleHide() {
    if (this.state.inputFocused) {
      return;
    }

    this.setState({
      focused: false
    });

    if (this.props.onBlur) {
      var event = document.createEvent('CustomEvent');
      event.initEvent('Change Date', true, false);
      this.hiddenInputRef.current.dispatchEvent(event);
      this.props.onBlur(event);
    }
  }

  handleKeyDown(e) {
    if (e.which === 9 && this.state.inputFocused) {
      this.setState({
        focused: false
      });

      if (this.props.onBlur) {
        var event = document.createEvent('CustomEvent');
        event.initEvent('Change Date', true, false);
        this.hiddenInputRef.current.dispatchEvent(event);
        this.props.onBlur(event);
      }
    }
  }

  handleFocus() {
    if (this.state.focused === true) {
      return;
    }

    var placement = this.getCalendarPlacement();
    this.setState({
      inputFocused: true,
      focused: true,
      calendarPlacement: placement
    });

    if (this.props.onFocus) {
      var event = document.createEvent('CustomEvent');
      event.initEvent('Change Date', true, false);
      this.hiddenInputRef.current.dispatchEvent(event);
      this.props.onFocus(event);
    }
  }

  handleBlur() {
    this.setState({
      inputFocused: false
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(this.state.inputFocused === true && nextState.inputFocused === false);
  }

  getValue() {
    return this.state.selectedDate ? this.state.selectedDate.toISOString() : null;
  }

  getFormattedValue() {
    return this.state.displayDate ? this.state.inputValue : null;
  }

  getCalendarPlacement() {
    var tag = Object.prototype.toString.call(this.props.calendarPlacement);
    var isFunction = tag === '[object AsyncFunction]' || tag === '[object Function]' || tag === '[object GeneratorFunction]' || tag === '[object Proxy]';

    if (isFunction) {
      return this.props.calendarPlacement();
    } else {
      return this.props.calendarPlacement;
    }
  }

  makeInputValueString(date) {
    var month = date.getMonth() + 1;
    var day = date.getDate(); //this method is executed during intialState setup... handle a missing state properly

    var separator = this.state ? this.state.separator : this.props.dateFormat.match(/[^A-Z]/)[0];

    if (this.props.dateFormat.match(/MM.DD.YYYY/)) {
      return (month > 9 ? month : "0".concat(month)) + separator + (day > 9 ? day : "0".concat(day)) + separator + date.getFullYear();
    } else if (this.props.dateFormat.match(/DD.MM.YYYY/)) {
      return (day > 9 ? day : "0".concat(day)) + separator + (month > 9 ? month : "0".concat(month)) + separator + date.getFullYear();
    } else {
      return date.getFullYear() + separator + (month > 9 ? month : "0".concat(month)) + separator + (day > 9 ? day : "0".concat(day));
    }
  }

  handleBadInput(originalValue) {
    var parts = originalValue.replace(new RegExp("[^0-9".concat(this.state.separator, "]")), '').split(this.state.separator);

    if (this.props.dateFormat.match(/MM.DD.YYYY/) || this.props.dateFormat.match(/DD.MM.YYYY/)) {
      if (parts[0] && parts[0].length > 2) {
        parts[1] = parts[0].slice(2) + (parts[1] || '');
        parts[0] = parts[0].slice(0, 2);
      }

      if (parts[1] && parts[1].length > 2) {
        parts[2] = parts[1].slice(2) + (parts[2] || '');
        parts[1] = parts[1].slice(0, 2);
      }

      if (parts[2]) {
        parts[2] = parts[2].slice(0, 4);
      }
    } else {
      if (parts[0] && parts[0].length > 4) {
        parts[1] = parts[0].slice(4) + (parts[1] || '');
        parts[0] = parts[0].slice(0, 4);
      }

      if (parts[1] && parts[1].length > 2) {
        parts[2] = parts[1].slice(2) + (parts[2] || '');
        parts[1] = parts[1].slice(0, 2);
      }

      if (parts[2]) {
        parts[2] = parts[2].slice(0, 2);
      }
    }

    this.setState({
      inputValue: parts.join(this.state.separator)
    });

    if ( this.props.onChange ) {
      this.props.onChange('invalid')
    }
  }

  handleInputChange(aEvent) {
    var originalValue = this.inputRef.current.value;
    var inputValue = originalValue.replace(/(-|\/\/)/g, this.state.separator).slice(0, 10);

    if (!inputValue) {
      this.clear();
      return;
    }

    var month, day, year;

    let parts = inputValue.split(this.state.separator)
    if ( parts.length !== 3 )
      return this.handleBadInput(originalValue);
    let fmt = this.props.dateFormat
    if ( fmt.match(/MM.DD.YYYY/) ) {
      month = parts[0]
      day = parts[1]
      year = parts[2]
    } else if ( fmt.match(/DD.MM.YYYY/) ) {
      day = parts[0]
      month = parts[1]
      year = parts[2]
    } else {
      year = parts[0]
      month = parts[1]
      day = parts[2]
    }
    if ( (! year) || (! month) || (! day) )
      return this.handleBadInput(originalValue);

/*
    if (this.props.dateFormat.match(/MM.DD.YYYY/)) {
      if (!inputValue.match(/[0-1][0-9].[0-3][0-9].[1-2][0-9][0-9][0-9]/)) {
        return this.handleBadInput(originalValue);
      }

      month = inputValue.slice(0, 2).replace(/[^0-9]/g, '');
      day = inputValue.slice(3, 5).replace(/[^0-9]/g, '');
      year = inputValue.slice(6, 10).replace(/[^0-9]/g, '');
    } else if (this.props.dateFormat.match(/DD.MM.YYYY/)) {
      if (!inputValue.match(/[0-3][0-9].[0-1][0-9].[1-2][0-9][0-9][0-9]/)) {
        return this.handleBadInput(originalValue);
      }

      day = inputValue.slice(0, 2).replace(/[^0-9]/g, '');
      month = inputValue.slice(3, 5).replace(/[^0-9]/g, '');
      year = inputValue.slice(6, 10).replace(/[^0-9]/g, '');
    } else {
      if (!inputValue.match(/[1-2][0-9][0-9][0-9].[0-1][0-9].[0-3][0-9]/)) {
        return this.handleBadInput(originalValue);
      }

      year = inputValue.slice(0, 4).replace(/[^0-9]/g, '');
      month = inputValue.slice(5, 7).replace(/[^0-9]/g, '');
      day = inputValue.slice(8, 10).replace(/[^0-9]/g, '');
    }
*/

    var monthInteger = parseInt(month, 10);
    var dayInteger = parseInt(day, 10);
    var yearInteger = parseInt(year, 10);

    if (monthInteger > 12 || dayInteger > 31 || monthInteger <= 0 || dayInteger <= 0 || yearInteger <= 1972 ) {
      return this.handleBadInput(originalValue);
    }

    if (!isNaN(monthInteger) && !isNaN(dayInteger) && !isNaN(yearInteger) && monthInteger <= 12 && dayInteger <= 31 && yearInteger > 999) {
      var selectedDate = new Date(yearInteger, monthInteger - 1, dayInteger, 12, 0, 0, 0);
      this.setState({
        selectedDate: selectedDate,
        displayDate: selectedDate,
        value: selectedDate.toISOString()
      });

      //if (this.props.onChange) {
        //this.props.onChange(selectedDate.toISOString(), inputValue);
      //}
    }
    if ( this.props.onChange ) {
      let pad = global.padWithZeroes
      let ymd = pad(year, 4) + '-' + pad(month, 2) + '-' + pad(day, 2)
      if ( aEvent )
        this.rememberCursorPosition(aEvent.target)
      this.props.onChange(ymd, inputValue);
      if ( aEvent )
        this.restoreCursorPosition(aEvent.target)
    }


    this.setState({
      inputValue: inputValue
    });
  }

  rememberCursorPosition(aElement) {
    if ( ! aElement ) return
    this.cursorPosition = aElement.selectionStart
  }

  restoreCursorPosition(aElement) {
    if ( ! aElement ) return
    let pos = this.cursorPosition
    setTimeout(() => {
      aElement.selectionStart = pos
      aElement.selectionEnd = pos
    },
    50)
  }

  onChangeMonth(newDisplayDate) {
    this.setState({
      displayDate: newDisplayDate
    });
  }

  onChangeDate(newSelectedDate) {
    var inputValue = this.makeInputValueString(newSelectedDate);
    this.setState({
      inputValue: inputValue,
      selectedDate: newSelectedDate,
      displayDate: newSelectedDate,
      value: newSelectedDate.toISOString(),
      focused: false
    });

    if (this.props.onBlur) {
      var event = document.createEvent('CustomEvent');
      event.initEvent('Change Date', true, false);
      this.hiddenInputRef.current.dispatchEvent(event);
      this.props.onBlur(event);
    }

    if (this.props.onChange) {
      this.props.onChange(newSelectedDate.toISOString(), inputValue);
    }
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    var value = newProps.value;

    if ( value === global.emptyYMD() )
      return
    if ( value === global.invalidYMD() )
      return

    if (this.getValue() !== value) {
      this.setState(this.makeDateValues(value));
    }
  }

  render() {
    //var calendarHeader = _react.default.createElement(_DatePickerHeader.default, {
    var calendarHeader = _react.default.createElement(_DatePickerHeader, {
      previousButtonElement: this.props.previousButtonElement,
      nextButtonElement: this.props.nextButtonElement,
      displayDate: this.state.displayDate,
      minDate: this.props.minDate,
      maxDate: this.props.maxDate,
      onChange: newDisplayDate => this.onChangeMonth(newDisplayDate),
      monthLabels: this.props.monthLabels,
      dateFormat: this.props.dateFormat
    });

    //var calendar = _react.default.createElement(_DatePickerCalendar.default, {
    var calendar = _react.default.createElement(_DatePickerCalendar, {
      cellPadding: this.props.cellPadding,
      selectedDate: this.state.selectedDate,
      displayDate: this.state.displayDate,
      onChange: newSelectedDate => this.onChangeDate(newSelectedDate),
      dayLabels: this.state.dayLabels,
      weekStartsOn: this.props.weekStartsOn,
      showTodayButton: this.props.showTodayButton,
      todayButtonLabel: this.props.todayButtonLabel,
      minDate: this.props.minDate,
      maxDate: this.props.maxDate,
      roundedCorners: this.props.roundedCorners,
      showWeeks: this.props.showWeeks
    });

    //var controlId = "rdp-form-control-".concat(this.idSuffix);
    var controlId = this.idSuffix;

    if (this.props.customControl != undefined && this.props.customControl.props.id) {
      controlId = this.props.customControl.props.id;
    }

    var control = this.props.customControl ? _react.default.cloneElement(this.props.customControl, {
      id: controlId,
      onKeyDown: e => this.handleKeyDown(e),
      value: this.state.inputValue || '',
      required: this.props.required,
      placeholder: this.state.focused ? this.props.dateFormat : this.state.placeholder,
      ref: this.inputRef,
      disabled: this.props.disabled,
      onFocus: () => this.handleFocus(),
      onBlur: () => this.handleBlur(),
      onChange: (aEvent) => this.handleInputChange(aEvent),
      className: "rdp-form-control ".concat(this.props.className || ''),
      style: this.props.style,
      autoComplete: this.props.autoComplete,
      onInvalid: this.props.onInvalid,
      noValidate: this.props.noValidate
    }) : _react.default.createElement(_reactstrap.Input, {
      id: controlId,
      onKeyDown: e => this.handleKeyDown(e),
      value: this.state.inputValue || '',
      required: this.props.required,
      innerRef: this.inputRef,
      type: "text",
      name: this.props.name,
      className: "rdp-form-control ".concat(this.props.className || ''),
      style: this.props.style,
      autoFocus: this.props.autoFocus,
      disabled: this.props.disabled,
      placeholder: this.state.focused ? this.props.dateFormat : this.state.placeholder,
      onFocus: () => this.handleFocus(),
      onBlur: () => this.handleBlur(),
      onChange: (aEvent) => this.handleInputChange(aEvent),
      onClick: this.props.onClick,
      autoComplete: this.props.autoComplete,
      onInvalid: this.props.onInvalid,
      noValidate: this.props.noValidate
    });
    return _react.default.createElement(_reactstrap.InputGroup, {
      size: this.props.size,
      id: "rdp-input-group-".concat(this.idSuffix),
      className: 'rdp-input-group'
    }, control, _react.default.createElement(_reactstrap.Popover, {
      className: "rdp-popover ".concat(this.state.calendarPlacement),
      toggle: () => this.handleHide(),
      isOpen: this.state.focused,
      container: this.props.calendarContainer || this.overlayContainerRef.current,
      target: controlId,
      placement: this.state.calendarPlacement,
      delay: 200
    }, _react.default.createElement(_reactstrap.PopoverHeader, {
      tag: "div"
    }, calendarHeader), _react.default.createElement(_reactstrap.PopoverBody, null, calendar)), _react.default.createElement("div", {
      ref: this.overlayContainerRef,
      className: "rdp-overlay"
    }), _react.default.createElement("input", {
      ref: this.hiddenInputRef,
      type: "hidden",
      className: "rdp-hidden",
      //id: this.props.id != undefined ? this.props.id : "rdp-hidden-".concat(this.idSuffix),
      id: "rdp-hidden-".concat(this.idSuffix),
      //name: this.props.name,
      value: this.state.value || '',
      "data-formattedvalue": this.state.value ? this.state.inputValue : ''
    }), this.props.showClearButton && !this.props.customControl && _react.default.createElement(_reactstrap.InputGroupAddon, {
      onClick: () => this.props.disabled ? null : this.clear(),
      style: {
        cursor: this.state.inputValue && !this.props.disabled ? 'pointer' : 'not-allowed'
      },
      addonType: "append",
      className: "rdp-addon"
    }, _react.default.createElement(_reactstrap.InputGroupText, {
      style: {
        opacity: this.state.inputValue && !this.props.disabled ? 1 : 0.5
      }
    }, this.props.clearButtonElement)), this.props.children);
  }

}

DatePicker.propTypes = {
  defaultValue: _propTypes.default.string,
  value: _propTypes.default.string,
  required: _propTypes.default.bool,
  className: _propTypes.default.string,
  style: _propTypes.default.object,
  minDate: _propTypes.default.string,
  maxDate: _propTypes.default.string,
  cellPadding: _propTypes.default.string,
  autoComplete: _propTypes.default.string,
  placeholder: _propTypes.default.string,
  dayLabels: _propTypes.default.array,
  monthLabels: _propTypes.default.array,
  onChange: _propTypes.default.func,
  onClear: _propTypes.default.func,
  onBlur: _propTypes.default.func,
  onFocus: _propTypes.default.func,
  autoFocus: _propTypes.default.bool,
  disabled: _propTypes.default.bool,
  weekStartsOn: _propTypes.default.number,
  clearButtonElement: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]),
  showClearButton: _propTypes.default.bool,
  previousButtonElement: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]),
  nextButtonElement: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.object]),
  calendarPlacement: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.func]),
  dateFormat: _propTypes.default.string,
  // 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD', 'DD-MM-YYYY'
  size: _propTypes.default.string,
  calendarContainer: _propTypes.default.object,
  id: _propTypes.default.string,
  name: _propTypes.default.string,
  showTodayButton: _propTypes.default.bool,
  todayButtonLabel: _propTypes.default.string,
  customControl: _propTypes.default.object,
  roundedCorners: _propTypes.default.bool,
  showWeeks: _propTypes.default.bool,
  children: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.node), _propTypes.default.node]),
  onInvalid: _propTypes.default.func,
  noValidate: _propTypes.default.bool
};

var defaultDateFormat = () => {
  var language = typeof window !== 'undefined' && window.navigator ? (window.navigator.userLanguage || window.navigator.language || '').toLowerCase() : '';
  var dateFormat = !language || language === 'en-us' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
  return dateFormat;
};

DatePicker.defaultProps = {
  cellPadding: '5px',
  dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  monthLabels: ['January'.translate(), 'February'.translate(), 'March'.translate(), 'April'.translate(), 'May'.translate(), 'June'.translate(), 'July'.translate(), 'August'.translate(), 'September'.translate(), 'October'.translate(), 'November'.translate(), 'December'.translate()],
  clearButtonElement: '×',
  previousButtonElement: '<',
  nextButtonElement: '>',
  calendarPlacement: 'bottom',
  dateFormat: defaultDateFormat(),
  showClearButton: true,
  autoFocus: false,
  disabled: false,
  showTodayButton: false,
  todayButtonLabel: 'Today',
  autoComplete: 'on',
  showWeeks: false,
  style: {
    width: '100%'
  },
  roundedCorners: false,
  noValidate: false
};
//var _default = DatePicker;
//exports.default = _default;
