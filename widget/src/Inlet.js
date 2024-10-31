import React from 'react'
import { Input } from 'reactstrap'
require('./Globals.js')

export default class Inlet extends React.Component {

  constructor(props) {
    super(props)
    this.state = {value: props.externalValue}
  }

  onChange(event) {
    if ( global.autoTesting )
      this.onFocus()
    this.changedSinceFocus = true
    this.setState({value: event.target.value})
    if ( global.autoTesting )
      global.prfiExecDeferred(this.onBlur.bind(this), {noSpinner: true})
  }

  onBlur() {
    this.hasFocus = false
    let value = this.state.value
    if ( ! this.changedSinceFocus )
      value = this.props.externalValue
    this.props.onBlur(value)
  }

  onFocus() {
    this.hasFocus = true
    this.changedSinceFocus = false
  }

  onClick(event) {
    let el = event.target
    if ( global.lastClickedInput === el ) return null // prevent Edge stopping you from clicking inside the text after you first click in
    global.lastClickedInput = el
    if ( ! global.isFunction(el.select) ) return null
    el.select()
  }

  render() {
    let props = this.props
    let id = props.id
    let value = this.state.value
    if ( (! this.hasFocus) || (! this.changedSinceFocus) ) 
      value = props.externalValue
    let className = this.props.classRoot + "Input"
    let style = {}
    if ( props.widthPx )
      style.width = props.widthPx + 'px'
    return (
      <Input
        id={id}
        className={className}
        key={id}
        name = {"stocktend_" + id}
        value={value}
        onChange={this.onChange.bind(this)}
        onBlur={this.onBlur.bind(this)}
        onFocus={this.onFocus.bind(this)}
        onClick={this.onClick.bind(this)}
        disabled={props.disabled}
        invalid={props.invalid}
        style={style}
      >
      </Input>
    )
  }

}
