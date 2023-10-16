const express = require('express')
const app = express()
const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB('dull-lime-cod-robeCyclicDB')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// app.use(express.static('public', options))

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
app.get('/', async (req, res) => {
  res.json({ msg: 'hello world' }).end()
})

app.post('/api', async (req, res) => {
  const { name, email } = req.body
  const result = await db.putItem({ name, email })
  res.json(result).end()
})