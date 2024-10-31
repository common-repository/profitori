import React from 'react'
import { Container, Row, Col, Label } from 'reactstrap'
'ProfitoriPro'.page({expose: true})
'Profitori PRO'.title()
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
            <Row><Label className="prfi_pro_sub_label">{"Truly master your operations with Profitori PRO".translate()}</Label></Row>
          </Col>
        </Row>
        <Row>
          <Col className="text-center mt-3">
            <a className="stGoProCentered" href="https://profitori.com/pro" target="_blank" rel="noopener noreferrer">Click here to view Profitori PRO features</a>
          </Col>
        </Row>
      </Col>
    </Row>
    <div style={{height: "20px"}}>
    </div>
  </Container>
)


