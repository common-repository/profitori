import React from 'react'
import { Container, Row, Col, Label } from 'reactstrap'
'PROFulfillment'.page({expose: true})
'PRO Fulfillment'.title()
'blurb'.field({snippet: true})

'blurb'.content(
  <Container key="logo" className="mt-5">
    <Row>
      <Col>
        <Row>
          <Col className="text-center">
            <Row><Label className="prfi_pro_label">{"Go PRO!... For Total Control".translate()}</Label></Row>
          </Col>
        </Row>
        <Row>
          <Col className="text-center">
            <Row><Label className="prfi_pro_sub_label">{"Push those orders out the door fast with Profitori Fulfillment".translate()}</Label></Row>
          </Col>
        </Row>
        <Row>
          <Col className="text-center mt-3">
            <a className="stGoProCentered" href="https://profitori.com/pro/fulfillment" target="_blank" rel="noopener noreferrer">Click here to view Profitori PRO Fulfillment features</a>
          </Col>
        </Row>
      </Col>
    </Row>
    <div style={{height: "20px"}}>
    </div>
  </Container>
)


