const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { Client } = require("@googlemaps/google-maps-services-js");


dotenv.config();
const client = new Client({});
const app = express();

const CyclicDB = require("@cyclic.sh/dynamodb");
const db = CyclicDB("dull-lime-cod-robeCyclicDB");

const signAccessToken = (key) => {
  const jwtSecret = "wzPe7g19Yan27T2ATud1Kw==";
  return jwt.sign({ key: key }, jwtSecret, {
    expiresIn: "3h",
  });
};

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(express.static('public', options))

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`index.js listening on ${port}`);
});
app.get("/", async (req, res) => {
  // testing code on server
  res.json({ msg: "hello world" }).end();
});

app.post("/api", async (req, res) => {
  const { name, email } = req.body;
  const result = await db.putItem({ name, email });
  res.json(result).end();
});

// app.post('/:col/:key', async (req, res) => { // deleting a key from a collection
//   console.log(req.body)

//   const col = req.params.col
//   const key = req.params.key
//   console.log(`from collection: ${col} delete key: ${key} with params ${JSON.stringify(req.params)}`)
//   const item = await db.collection(col).set(key, req.body)
//   console.log(JSON.stringify(item, null, 2))
//   res.json(item).end()
// })
app.post("/clients/new", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const client = await db.collection("doceaseclients").get(email);

    // If the user exists, return a message
    if (client) {
      res.status(400).json({ success: false, message: "User already exists." });
      return;
    }

    const saltRounds = 12;
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Replace the plain password with the hashed version
    req.body.password = hashedPassword;

    // Store the user in the database
    const result = await db.collection("doceaseclients").set(email, req.body);
    console.log(JSON.stringify(result, null, 2));
    res.json({
      success: true,
      message: "User added successfully.",
      data: { added: true },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.get("/:col/:key", async (req, res) => {
  // getting a key from a collection
  const col = req.params.col;
  const key = req.params.key;
  console.log(
    `from collection: ${col} get key: ${key} with params ${JSON.stringify(
      req.params
    )}`
  );
  const item = await db.collection(col).get(key);
  console.log(JSON.stringify(item, null, 2));
  res.json(item).end();
});

app.get("/:col", async (req, res) => {
  // listing a collection
  const col = req.params.col;
  console.log(
    `list collection: ${col} with params: ${JSON.stringify(req.params)}`
  );
  const items = await db.collection(col).list();
  console.log(JSON.stringify(items, null, 2));
  res.json(items).end();
});

app.post("collection/:colName", async (req, res) => {
  // creating a collection
  const { colName } = req.params;
  const newCollection = await db.collection(colName);
  console.log(JSON.stringify(newCollection, null, 2));
  res.json(newCollection).end();
});

app.delete("collection/:colName", async (req, res) => {
  // deleting a collection
  const { colName } = req.params;
  // try{}
  await db.delete(colName);
  console.log(JSON.stringify(newCollection, null, 2));
  res.json(newCollection).end();
});

app.post("/login", async (req, res) => {
  // login
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Both email and password are required.",
    });
  }

  try {
    // Fetch the client data from the database using the provided email
    const student = await db.collection("doceaseclients").get(email);

    // If the student doesn't exist or passwords don't match, return an error
    if (!student || student.props.password !== password) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    // If everything is okay, return a success message (and possibly a token or any other data)
    res.json({
      success: true,
      message: "Login successful.",
      data: { firstname: student.props.firstname },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// deleting a user if they exist
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("doceaseclients").delete(id);
    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetching the client with the provided email
    const client = await db.collection("doceaseclients").get(email);
    if (client) {
      const passwordMatch = await bcrypt.compare(
        password,
        client.props.password
      );
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid password entered." });
      } else {
        // return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        const accessToken = signAccessToken(client.key);
        return res.status(200).json({
          success: true,
          message: "Login successful.",
          data: { client },
          accessToken: accessToken,
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: `Email adress not found, if you don't have an account please sign up.`,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// verifying if email already exists in the database
app.post("/users/verify", async (req, res) => {
  const { email } = req.body;

  try {
    const student = await db.collection("doceaseclients").get(email);
    res.json({
      success: true,
      message: "User verified successfully.",
      data: { exists: !!student },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// Get hospitals/health facilities within given radius using googlemaps
app.get("/near-by-places", async (req, res) => {
  const latitude = req.query.latitude;
  const longitude = req.query.longitude;

  try {
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Please provide location co-ordinates",
      });
    }
    const healthFacilities = await client.placesNearby({
      params: {
        location: `${latitude}, ${longitude}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        radius: 1000,
        types: ["hospital", "health"],
      },
    });
    if (healthFacilities.statusText !== "OK") {
      return res
        .status(400)
        .json({ success: false, message: "could not find places" });
    }

    res.status(200).json({
      success: true,
      message: "get health successfully",
      data: healthFacilities.data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});
