import React from 'react'
import Hook from './Hook.js'
import { Label } from 'reactstrap'
require('./Globals.js')

let Maint = global.prfiMaintClass
let List = global.prfiListClass
let Page = global.prfiPageClass

export default class Feature extends React.Component {

  render() {
    if ( ! this.initialised ) {
      if ( this.initialising )
        return (
          <div>   
            {"Loading...".translate()}
          </div>
        )
      this.initialising = true
      global.prfiExecDeferred(this.initialise.bind(this), {noSpinner: true})
      return (
        <div>   
          {"Loading...".translate()}
        </div>
      )
    }
    if ( this.isCustom() )
      return this.renderCustom()
    let res = this.createReactElement()
    return res
  }

  renderCustom() {
    if ( (! this.customSpec) && (! this.extension) )
      return this.parseErrorElement(this.operation().specname + " is not a valid Custom Spec or Extension".translate())
    let m = new global.prfiMachineClass()
    if ( this.customSpec )
      this.attributes = m.customSpecToAttributes(this.customSpec)
    else
      this.attributes = m.extensionToAttributes(this.extension)
    let res = this.createReactElement()
    return res
  }

  async initialise() {
    let specName = this.operation().specname; if ( ! specName ) return
    if ( specName.endsWith('.js') ) {
      let Machine = new global.prfiMachineClass()
      this.attributes = await Machine.specnameToAttributesAsync(specName)
      if ( this.attributes.alternativeSpec ) {
        let altSpecName = await this.attributes.alternativeSpec()
        if ( altSpecName ) {
          specName = altSpecName
          this.operation().specname = specName
        }
      }
    }
    if ( ! specName.endsWith('.js') ) {
      this.customSpec = await 'CustomSpec'.bringFirst({name: specName})
      if ( ! this.customSpec )
        this.extension = await 'Extension'.bringFirst({specname: specName})
    }
    this.accessDenied = false
    let c = await 'Configuration'.bringFirst()
    let controlAccessAtPageLevel = c && c.controlAccessAtPageLevel
    if ( controlAccessAtPageLevel ) {
      let sess = await 'session'.bringSingle()
      let userHasAdminRights = sess && sess.userHasAdminRights
      if ( ! userHasAdminRights ) {
        let cookedSpecName = specName.stripRight('.js')
        let specConfig = await 'SpecConfig'.bringSingle({specName: cookedSpecName})
        if ( specConfig ) {
          let users = specConfig.usersWithAccessToSpec
          if ( users ) {
            users = "," + users.replace(" ", "") + ","
            if ( users.indexOf("," + global.gApp.user + ",") < 0 ) {
              this.accessDenied = true
            }
          }
        }
      }
    }
    this.initialised = true
    this.initialising = false
    this.forceUpdate()
    global.gApp.refreshWPMenuHighlighting({fromFeatureInit: true})
  }

  isCustom() {
    return ! this.operation().specname.endsWith('.js')
  }

  getKey() {
    return this.attributes.componentName + global.gApp.currentSituation.hash
  }

  parseErrorElement(msg) {
    if ( ! msg ) return null
    msg = 'This custom spec is invalid and cannot be viewed until it is reviewed and fixed.'.translate() +
      ' ' + 'Javascript error:'.translate() + ' "' + msg + '"'
    let id = 'stParseError'
    return (
      <div>
        <div>
          <Label for={id} className="stLabel">
            {'Custom Spec Error'.translate()}
          </Label>
        </div>
        <div>
          <Label className="stTextField" name="stParseError" value={msg} id={id}>
            {msg}
          </Label>
        </div>
      </div>
    )
  }

  accessDeniedElement() {
    let msg = 'You do not have permission to use this page.'.translate()
    let id = 'stAccessDeniedError'
    return (
      <div>
        <div>
          <Label for={id} className="stLabel">
            {'Access Denied'.translate()}
          </Label>
        </div>
        <div>
          <Label className="stTextField" name="stAccessDeniedError" value={msg} id={id}>
            {msg}
          </Label>
        </div>
      </div>
    )
  }

  createReactElement() {
    Maint = global.prfiMaintClass
    List = global.prfiListClass
    Page = global.prfiPageClass
    let a = this.attributes
    let cn = a.componentName
    if ( this.accessDenied )
      return this.accessDeniedElement()
    if ( (! cn) && a.parseError )
      return this.parseErrorElement(this.attributes.parseError)
    let p = this.props
    let key = this.getKey()
    this.refreshDerivedAttributes()
    document.title = 'Profitori - ' + a.title
    let res = Hook.apply('featureCreateReactElement', {defaultResult: null, feature: this})
    if ( res )
      return res
    if ( cn === "Maint" ) {
      return ( 
        <Maint 
          key={key}
          operation={p.operation} 
          attributes={a} 
          forward={p.forward}
          showMessage={p.showMessage}
          cast={p.cast}
          parentCast={p.parentCast}
          callerSpecname={p.callerSpecname}
          callerCast={p.callerCast}
          containerSpecname={p.containerSpecname}
          containerCast={p.containerCast}
          situation={p.situation}
          containerSituation={p.containerSituation}
          hideCancelButton={p.hideCancelButton}
          hideLogo={p.hideLogo}
          hideContactSupport={p.hideContactSupport}
          scroller={p.scroller}
        /> 
      )
    } else if ( cn === "List" )
      return ( 
        <List 
          key={key}
          operation={p.operation} 
          parentCast={p.parentCast}
          callerCast={p.callerCast}
          attributes={a} 
          forward={p.forward}
          showMessage={p.showMessage}
          situation={p.situation}
          containerSituation={p.containerSituation}
          hideCancelButton={p.hideCancelButton}
          hideLogo={p.hideLogo}
          hideContactSupport={p.hideContactSupport}
          title={p.title}
          scroller={p.scroller}
          tileWidthPx={p.tileWidthPx}
          inTile={p.inTile}
          provideVeil={p.provideVeil}
          containerRefreshNo={p.containerRefreshNo}
        /> 
      )
    else if ( cn === "Page" )
      return ( 
        <Page 
          key={key}
          operation={p.operation} 
          parentCast={p.parentCast}
          callerCast={p.callerCast}
          attributes={a} 
          forward={p.forward}
          showMessage={p.showMessage}
          situation={p.situation}
          containerSituation={p.containerSituation}
        /> 
      )
  }

  operation() {
    return this.props.operation
  }

  refreshDerivedAttributes() {
    let a = this.attributes
    let op = this.operation()
    a.specname = op.specname
    if ( op.behaviour === "add" )
      a.title = a.titleWhenAdding
    else
      a.title = a.titleWhenEditing
    if ( ! a.title )
      a.title = a.name
  }

}
