const express = require('express')
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 

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

app.post('/clients/new', async (req, res) => { // Sign up
  const { email, password } = req.body;

  try {
    // Checking if the user exists
    const client = await db.collection('doceaseclients').get(email);

    // If the user exists, return a message
    if (client) {
      res.json({ success: false, message: 'User already exists.' });
      return;
    }

    // Hashing the password before storing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Replace the plain password with the hashed version
    req.body.password = hashedPassword;

    // Storing the user in the database
    const result = await db.collection('doceaseclients').set(email, req.body);
    console.log(JSON.stringify(result, null, 2));
    res.json({ success: true, message: 'User added successfully.', data: { added: true } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

app.post('/users/login', async (req, res) => { // Login
  const { email, password } = req.body;

  try {
    // Fetching the client with the provided email
    const client = await db.collection('doceaseclients').get(email);
    if (client) {
      const passwordMatch = await bcrypt.compare(password, client.props.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid password entered.' });
      }
      else{
        // return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        return res.status(200).json({ success: true, message: 'Login successful.',data: { client } });
      }
  }
  else{
    return res.status(401).json({ success: false, message: `Email adress not found, if you don't have an account please sign up.` });
  }
} catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: '@gmail.com', //gmail address
      pass: '' // gmail password
  }
});

const sendPasswordResetEmail = async (email, token) => {
  try {
      const resetLink = `https://yourfrontendapp.com/reset-password?token=${token}`; // to change when sent link to frontend

      const mailOptions = {
          from: 'YOUR_GMAIL_ADDRESS@gmail.com',
          to: email,
          subject: 'Password Reset Request',
          html: `
              <p>You requested a password reset. Click the link below to reset your password:</p>
              <a href="${resetLink}">${resetLink}</a>
              <p>If you did not request this, please ignore this email.</p>
          `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.response);
  } catch (error) {
      console.error('Error sending password reset email:', error);
  }
};

app.post('/users/request-password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        // Checking if email exists in the database
        const user = await db.collection('doceaseclients').get(email);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found.' });
        }

        // for generating a unique token for this password reset request
        const token = crypto.randomBytes(20).toString('hex');

        // Storing the token in the database with an expiration time
        await db.collection('passwordResetTokens').set(email, {
            token,
            expires: new Date(Date.now() + 3600000) // 1 hour from now
        });

        // Sending an email to the user with the reset link
        await sendPasswordResetEmail(email, token);

        res.json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});
