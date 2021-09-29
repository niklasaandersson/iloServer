const express = require('express')
const helmet = require('helmet')
const logger = require('morgan')
var cors = require('cors')
const { body, validationResult } = require('express-validator')
const port = process.env.PORT || 9000
const { google } = require('googleapis')

const app = express()
require('dotenv').config()

app.use(helmet())
app.use(cors({ origin: ['http://localhost:3000', 'https://rebuildingbetter.netlify.app'] }))
app.use(logger('dev'))
app.use(express.json())

// This disables the `contentSecurityPolicy` middleware but keeps the rest.
app.use(helmet.contentSecurityPolicy({
  referrerPolicy: { policy: 'no-referrer' },
  contentSecurityPolicy: false,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"]
  }
}))

app.post(
  '/submit',

  // Validation of input from request.
  body('name').isLength({ min: 2 }),
  body('company').isLength({ min: 2 }),
  body('email').isEmail(),
  body('phone').isMobilePhone(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { country, employees, revenue, name, company, phone, email } = req.body

    // Open connection to Google Sheets.

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: 'https://www.googleapis.com/auth/spreadsheets'
    })

    const client = await auth.getClient()
    const googleSheets = google.sheets({ version: 'v4', auth: client })
    const spreadsheetId = '1ym2cBoikffl9LobJix_o4dXyCxe2zbjZ87Gjl8ugehc'

    // Write to Google Sheet
    await googleSheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[country, employees, revenue, name, company, phone, email]]
      }
    })

    res.status(200).json({ message: 'success' })
  })

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
