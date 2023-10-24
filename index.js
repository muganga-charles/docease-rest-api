const express = require('express')
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;
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

// app.post('/:col/:key', async (req, res) => { // deleting a key from a collection
//   console.log(req.body)

//   const col = req.params.col
//   const key = req.params.key
//   console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
//   const item = await db.collection(col).set(key, req.body)
//   console.log(JSON.stringify(item, null, 2))
//   res.json(item).end()
// })


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

app.post('/clients/new', async (req, res) => {
  const { email, password } = req.body;

  try {
      // Check if the user exists
      const client = await db.collection('doceaseclients').get(email);

      // If the user exists, return a message
      if (client) {
          res.json({ success: false, message: 'User already exists.' });
          return;
      }

      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Replace the plain password with the hashed version
      req.body.password = hashedPassword;

      // Store the user in the database
      const result = await db.collection('doceaseclients').set(email, req.body);
      console.log(JSON.stringify(result, null, 2));
      res.json({ success: true, message: 'User added successfully.', data: { added: true } });

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Fetching the client with the provided email
        const client = await db.collection('doceaseclients').get(email);

        if (!client) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // Checking if the provided password matches the stored hashed password
        const passwordMatch = await bcrypt.compare(password, client.password);

        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        // If both checks are valid, login is successful
        res.json({ success: true, message: 'Login successful.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});
