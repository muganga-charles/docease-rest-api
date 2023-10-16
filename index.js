
const express = require('express')
require('dotenv').config()
const app = express()
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const bodyParser = require('body-parser')
const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB('dull-lime-cod-robeCyclicDB')

app.use(express.json())
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))


const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})

app.get('*', async (req,res) => {
  let filename = req.path.slice(1)

  try {
    let s3File = await s3.getObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: filename,
    }).promise()

    res.set('Content-type', s3File.ContentType)
    res.send(s3File.Body.toString()).end()
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      console.log(`No such key ${filename}`)
      res.sendStatus(404).end()
    } else {
      console.log(error)
      res.sendStatus(500).end()
    }
  }
})

app.put('*', async (req,res) => {
  let filename = req.path.slice(1)

  console.log(typeof req.body)

  await s3.putObject({
    Body: JSON.stringify(req.body),
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Key: filename,
  }).promise()

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

app.delete('*', async (req,res) => {
  let filename = req.path.slice(1)

  await s3.deleteObject({
    Bucket: process.env.BUCKET,
    Key: filename,
  }).promise()

  res.set('Content-type', 'text/plain')
  res.send('ok').end()
})

app.use('*', (req,res) => {
  res.sendStatus(404).end()
})

app.get('/', async (req, res) => {
  res.json({ msg: 'hello world' }).end()
})

// creating a new collection
// app.post('/col', async (req, res) => {
//   const col = req.body.col
//   console.log(`creating collection: ${col}`)
//   const item = await db.createCollection(col)
//   console.log(JSON.stringify(item, null, 2))
//   res.json(item).end()
// })

// app.get('/col', async (req, res) => {
//     const col = req.params.col
//     const key = req.params.key
//     console.log(`from collection: ${col} get key: ${key} with params ${JSON.stringify(req.params)}`)
//     const item = await db.collection(col).get(key)
//     console.log(JSON.stringify(item, null, 2))
//     res.json(item).end()
//   })
