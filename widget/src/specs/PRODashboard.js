import React from 'react'
import { Container, Row, Col, Label } from 'reactstrap'
'PRODashboard'.page({expose: true})
'PRO Dashboard'.title()
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
            <Row><Label className="prfi_pro_sub_label">{"Know your state of play at a glance with the Profitori PRO Dashboard".translate()}</Label></Row>
          </Col>
        </Row>
        <Row>
          <Col className="text-center mt-3">
            <a className="stGoProCentered" href="https://profitori.com/pro/dashboard" target="_blank" rel="noopener noreferrer">Click here to view Profitori PRO Dashboard features</a>
          </Col>
        </Row>
      </Col>
    </Row>
    <div style={{height: "20px"}}>
    </div>
  </Container>
)


