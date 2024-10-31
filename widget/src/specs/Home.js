import React from 'react'
import { Container, Row, Col, Label } from 'reactstrap'
import Link from '../Link.js'
import logo from './images/banner-332x86.png'
import prologo from './images/probanner.png'
'Home'.page({noTitle: true, expose: true})
'blurb'.field({snippet: true})

'blurb'.content(
  <Container key="logo" className="mt-5">
    <Row>
      <Col>
        <Row>
          <Col className="text-center mt-3">
            <img src={logo} alt="logo"/>
          </Col>
        </Row>
        <Row>
          <Col className="text-center mt-5 mb-3" style={{fontSize: "24px"}}>
            {"The E-Commerce ERP".translate()}
          </Col>
        </Row>
        <Row>
          <Col className="text-center mt-3">
            {
              global.gApp.atumIsActive ? 
                <div>
                  <Link menuCaption="Copy ATUM Data" style={{fontSize: "16px", marginTop: "6px"}}>{"Import data from ATUM".translate()}</Link><br/>
                  <br/>
                </div>
              :
                null
            }
            <Link menuCaption="View Short Stock" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Eye', 'lg')}
              {"Assess your inventory requirements".translate()}
            </Link><br/>
            <Link menuCaption="Purchase Orders" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('PeopleArrows', 'lg')}
              {"Enter purchase orders".translate()}
            </Link><br/>
            <Link menuCaption="Receive Purchases" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Boxes', 'lg')}
              {"Track orders and receive goods".translate()}
            </Link><br/>
            <Link menuCaption="Inventory" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Warehouse', 'lg')}
              {"Adjust inventory levels".translate()}
            </Link><br/>
            <Link menuCaption="Inventory" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('FunnelDollar', 'lg')}
              {"Track and adjust average costs".translate()}
            </Link><br/>
            <Link menuCaption="Sales and Invoices" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('FileInvoiceDollar', 'lg')}
              {"View sales and produce invoice PDFs".translate()}
            </Link><br/>
            <Link menuCaption="Unpaid Invoices" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('HandHoldingUsd', 'lg')}
              {"View unpaid invoices".translate()}
            </Link><br/>
            <Link menuCaption="View Profits" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('DollarSign', 'lg')}
              {"View profits".translate()}
            </Link><br/>
            <Link menuCaption="Stocktake" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('HandPointRight', 'lg')}
              {"Do stocktakes".translate()}
            </Link><br/>
            <Link menuCaption="Suppliers" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('UserFriends', 'lg')}
              {"Enter supplier details".translate()}
            </Link><br/>
            <Link menuCaption="Customers" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('ShoppingBasket', 'lg')}
              {"View customer details".translate()}
            </Link><br/>
            <Link menuCaption="Locations" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Cubes', 'lg')}
              {"Manage multiple inventory locations".translate()}
            </Link><br/>
            <Link menuCaption="Currencies" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Coins', 'lg')}
              {"Manage multiple currencies".translate()}
            </Link><br/>
            <Link menuCaption="Reports" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('ThList', 'lg')}
              {"View reports".translate()}
            </Link><br/>
            <Link menuCaption="Search" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Search', 'lg')}
              {"Search across all data".translate()}
            </Link><br/>
            <Link menuCaption="Settings" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Cog', 'lg')}
              {"Settings".translate()}
            </Link><br/>
            <Link menuCaption="Modify Profitori" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('LightBulb', 'lg')}
              {"Customize Profitori to suit your business".translate()}
            </Link><br/>
            <Link menuCaption="Profitori PRO" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              <b>{"Do more with profitori PRO...".translate()}</b>
            </Link><br/>
            <Link menuCaption="PRO Preorders" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('FileInvoiceDollar', 'lg')}
              {"Enter and manage expected orders".translate()}
            </Link><br/>
            <Link menuCaption="PRO Sales Orders" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('FileInvoiceDollar', 'lg')}
              {"Advanced order entry with auto fees".translate()}
            </Link><br/>
            <Link menuCaption="PRO Fulfillment" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Truck', 'lg')}
              {"Manage order fulfillment".translate()}
            </Link><br/>
            <Link menuCaption="PRO Fulfillment" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('ListAlt', 'lg')}
              {"Print packing lists".translate()}
            </Link><br/>
            <Link menuCaption="PRO Work Orders" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Truck', 'lg')}
              {"Manufacture or assemble products".translate()}
            </Link><br/>
            <Link menuCaption="PRO Accounts Receivable" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('HandHoldingUsd', 'lg')}
              {"Manage your accounts receivable".translate()}
            </Link><br/>
            <Link menuCaption="PRO General Ledger" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('BalanceScale', 'lg')}
              {"Manage your financial accounts".translate()}
            </Link><br/>
            <Link menuCaption="PRO Dashboard" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('ChartLine', 'lg')}
              {"Monitor your business with the dashboard".translate()}
            </Link><br/>
            <Link menuCaption="PRO Bundles (Product Levels / Bill of Materials)" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Magic', 'lg')}
              {"Sell bundled/assembled (BOM) products".translate()}
            </Link><br/>
            <Link menuCaption="PRO Serial Tracking" className="stHomePageLink" style={{fontSize: "16px", marginTop: "6px"}}>
              {global.gApp.nameToIcon('Hashtag', 'lg')}
              {"Track and trace serial/lot numbers".translate()}
            </Link><br/>
            <br/>
            {"and more".translate()}
          </Col>
        </Row>
      </Col>
      <Col>
        <Row>
          <Col className="text-center mt-4">
            <img className="prfi_pro_logo" src={prologo} alt="prologo"/>
          </Col>
        </Row>
        <Row>
          <Col className="text-center" style={{fontSize: "24px", marginTop: "54px", marginBottom: "12px"}}>
            {"Profitori with the lot".translate()}
          </Col>
        </Row>
        <Row>
          <Col className="text-center stProCol">
            <a id="prfi_go_pro" className="stHomePageProLink" href="https://profitori.com/pro" target="_blank" rel="noopener noreferrer">
              {"Get Profitori PRO free for 90 days!".translate()}
            </a>
            <Row><Label className="prfi_pro_sub_label mt-4">{"No credit card required".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4">{"Truly master your operations with these powerful features...".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/fulfillment" target="_blank" rel="noopener noreferrer">{"Fulfillment".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View Unshipped Orders".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Manage Quantities to Pack".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Allocate Orders to Locations".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Print Packing Lists".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Mark Orders as Shipped".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View Shipment History".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Ration Stock Between Customers".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Ship from Supplier to Customer (Drop Ship)".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Inform Customers of Shipment Status in My Account Page".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/salesorders" target="_blank" rel="noopener noreferrer">{"Customer Order Management".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Enter WooCommerce customer orders directly in Profitori".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatic fee, levy and tax lines by customer and product".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/preorders" target="_blank" rel="noopener noreferrer">{"Preorders".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Enter expected orders without affecting WooCommerce".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Optionally exclude firm expected orders from store stock on hand".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Categorize as firm or planned".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatic fee, levy and tax lines by customer and product".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Convert to WooCommerce customer order with a single click".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/manufacturing" target="_blank" rel="noopener noreferrer">{"Manufacturing".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Enter Work Orders".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Work Order PDFs".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Manage Work Order Life-cycle".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Receive Completed Work Orders".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatically update Component stock levels".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatically update Finished Good Average Cost".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/ar" target="_blank" rel="noopener noreferrer">{"Accounts Receivable".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Manage Debtors".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatically Record Shipments as Invoices".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Enter Payments, Prepayments and Other AR Entries".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Track Customer Balances".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Manage Credit Limits".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View Financial Status During Fulfillment".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Inform Customers of Financial Status in My Account Page".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/gl" target="_blank" rel="noopener noreferrer">{"Accounting (General Ledger)".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Manage finances without expensive third-party software".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatically update accounts with Sales and Stock movements".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Use built-in Chart of Accounts based on international standards".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Rename accounts or add new ones to suit your operation".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Make manual journal entries".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View financial statements (Profit and Loss and Balance Sheet)".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Easily tailor financial statements to suit your operation".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/lots" target="_blank" rel="noopener noreferrer">{"Serial/Lot Track and Trace".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Record Serial/Lot Numbers on PO Receipts".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Record Serial/Lot Numbers on Goods Shipped".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Expiry Dates".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Traceability of Serial/Lot Numbers on all Stock Movements".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View Quantities on Hand of Individual Lots".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/bundles" target="_blank" rel="noopener noreferrer">{"Bundles (Product Levels)".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Show yet-to-be-assembled stock as available in your store".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Create multi-level component lists".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View quantities to be made".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Assemble straight from the Packing List".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Automatically adjusts stock levels of bundle and components".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Cost roll-up, including assembly overhead".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4 stHomePageBasicLink"><a href="https://profitori.com/pro/dashboard" target="_blank" rel="noopener noreferrer">{"Super-flexible, auto-refreshing live Dashboard".translate()}</a></Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"See what's important to YOU, at a glance".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Keep your finger on the pulse of your business".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Always there, automatically refreshed with the latest data".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Designed for (optional) full-screen display on second monitor".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Single page view with multiple lists, reports and charts".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Make your own dashboards for different users and purposes".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Choose tiles from the built in Profitori lists or reports".translate()}</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"Make your own tiles, using built in tiles as templates".translate()}</Label></Row>
            <Row><Label className="prfi_pro_label mt-4">And more...</Label></Row>
            <Row><Label className="prfi_pro_sub_label">{"View Consolidated Profits from Multiple Sites".translate()}</Label></Row>
          </Col>
        </Row>
      </Col>
    </Row>
  </Container>
)
