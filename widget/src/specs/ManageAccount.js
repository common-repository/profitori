import React from 'react'
import { Container, Row, Col } from 'reactstrap'
'ManageAccount'.page()
'Manage Account'.title()
'blurb'.field({snippet: true})

'blurb'.content(
  <Container key="logo" className="mt-5">
    <Row>
      <Col>
        <a id="stManageAccount" href="https://profitori.com/pro/my-account" target="_blank" rel="noopener noreferrer">{"Manage your account".translate()}</a>
      </Col>
    </Row>
    <div style={{height: "20px"}}>
    </div>
  </Container>
)

