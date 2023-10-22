const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express()

const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB('dull-lime-cod-robeCyclicDB')

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
}

app.use(express.json())
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json());
// app.use(express.static('public', options))

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
app.get('/', async (req, res) => { // testing code on server
  res.json({ msg: 'hello world' }).end()
})

app.post('/api', async (req, res) => {
  const { name, email } = req.body
  const result = await db.putItem({ name, email })
  res.json(result).end()
})

app.post('/:col/:key', async (req, res) => { // deleting a key from a collection
  console.log(req.body)

  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).set(key, req.body)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

app.get('/:col/:key', async (req, res) => { // getting a key from a collection
  const col = req.params.col
  const key = req.params.key
  console.log(`from collection: ${col} get key: ${key} with params ${JSON.stringify(req.params)}`)
  const item = await db.collection(col).get(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

app.get('/:col', async (req, res) => { // listing a collection
  const col = req.params.col
  console.log(`list collection: ${col} with params: ${JSON.stringify(req.params)}`)
  const items = await db.collection(col).list()
  console.log(JSON.stringify(items, null, 2))
  res.json(items).end()
})

app.post('collection/:colName', async (req, res) => { // creating a collection
  const { colName } = req.params;
  const newCollection = await db.collection(colName);
  console.log(JSON.stringify(newCollection, null, 2))
  res.json(newCollection).end()
})

app.delete('collection/:colName', async (req, res) => { // deleting a collection
  const { colName } = req.params;
  const newCollection = await db.deleteCollection(colName);
  console.log(JSON.stringify(newCollection, null, 2))
  res.json(newCollection).end()
})

app.post('/login', async (req, res) => { // trial on student login
  const { accessnumber, password } = req.body;

  if (!accessnumber || !password) {
    return res.status(400).json({ success: false, message: 'Both access number and password are required.' });
  }

  try {
    // Fetch the student data from the database using the provided access number
    const student = await db.collection('student').get(accessnumber);

    // If the student doesn't exist or passwords don't match, return an error
    if (!student || student.props.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid access number or password.' });
    }

    // If everything is okay, return a success message (and possibly a token or any other data)
    res.json({ success: true, message: 'Login successful.', data: { firstname: student.props.firstname } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});