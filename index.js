const express = require('express')
const logger = require('morgan')
const { body, validationResult } = require('express-validator')
const port = 9000
const { google } = require('googleapis')

const app = express()
require('dotenv').config()

app.use(logger('dev'))
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

app.use(express.json())

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
    res.status(200).json({ message: 'signup success' })

    // Open connection to Google Sheets.

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: 'https://www.googleapis.com/auth/spreadsheets'
    })

    const client = await auth.getClient()
    const googleSheets = google.sheets({ version: 'v4', auth: client })
    const spreadsheetId = '19HPmiRlSvMG4fm36HSkWjLrxsbIS_KRe1DzCDnosVh8'

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
  })

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
