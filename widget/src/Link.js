import React from 'react'
import { Button } from 'reactstrap'

export default class Link extends React.Component {

  render() {
    let f = this.props.onClick
    if ( ! f )
      f = this.onClick.bind(this)
    let style = {color: "#84BA65", backgroundColor: "transparent", border: "none", paddingBottom: "0px",
      paddingTop: "0px", verticalAlign: "top"}
    if ( this.props.style )
      style = global.mergeObjects(style, this.props.style)
    let id = this.props.id
    return (
      <Button 
        id={id}
        tabIndex={-1}
        className={"stLink " + this.props.className}
        style={style}
        onClick={f}
      >
        {this.props.children}
      </Button>
    )
  }

  onClick() {
    global.gApp.invokeMenuByCaption(this.props.menuCaption)
  }

}
