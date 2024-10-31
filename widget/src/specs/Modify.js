import React from 'react'
import { Container, Row, Col } from 'reactstrap'
'Modify'.page({expose: true})
'Modify Profitori'.title()
'Back'.action({act: 'cancel'})
'Modify Built-in Specs'.action({spec: "ModifyBuiltInSpecs.js"})
'Extension Specs'.action({spec: "ExtensionList.js"})
'blurb'.field({snippet: true})
'blurb'.content(
  <Container key="logo" className="mt-5">
    <Row>
      <Col className="mt-3 prfiBlurbMainHeading">
        Customization
      </Col>
    </Row>
    <Row>
      <Col className="mt-3 prfiBlurbHeading">
        Profitori was designed to be re-designed
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        Want to tweak things to get your business running super-efficiently?  Profitori was born to be tweaked!  Simple changes require little or no technical knowledge.  Or developers can utilize Profitori's powerful and expressive specification vocabulary (Javascript based) for rapid development of complex enhancements.
      </Col>
    </Row>
    <Row>
      <Col className="mt-3 prfiBlurbHeading">
        Do It Yourself...
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        Check out the <a href="https://profitori.com/wp-content/uploads/Profitori-User-Manual.pdf" target="_blank" rel="noopener noreferrer">manual</a> Appendix C to get started. 
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        Caption changes, hiding of unwanted fields, addition of new fields can usually be done with one or two lines.
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        Quick Example (Hide Supplier SKU in Purchase Order page): 
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-5">
        Click <i>Modify Built-in Specs</i> above
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-5">
        POMaint > Modify
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-5">
        Enter Javascript code: <b><i>'supplierSku'.field({"{"}hidden: true{"}"})</i></b>
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        You are not limited to simple changes - you can develop entire modules using <i>Modify Built-in Specs</i> and <i>Extension Specs</i>.
      </Col>
    </Row>
    <Row>
      <Col className="mt-3 prfiBlurbHeading">
        ...or let us do it for you
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        Anything you can imagine, we can do - from small changes, to altered work-flows, to entire new modules.  All quotes are fixed price for your peace of mind - at only $80 USD per hour for customizations that we include in the main product.  <a href="https://profitori.com/contactus/" target="_blank" rel="noopener noreferrer">Contact us</a> with a brief description of your requirement, to get the ball rolling.
      </Col>
    </Row>
    <Row>
      <Col className="mt-3 prfiBlurbHeading">
        Important Note
      </Col>
    </Row>
    <Row>
      <Col className="mt-1 ml-3">
        You can relax about upgrades - your customizations are kept.  Customizations made using <i>Modify Built-in Specs</i> and <i>Extension Specs</i> are *not* overwritten when you upgrade Profitori to newer versions.  They are kept separate to, and are applied "on top of" the core software.  Customizations we make for you that are included in the core product are of course retained for all future versions of the core product.
      </Col>
    </Row>
  </Container>
)

