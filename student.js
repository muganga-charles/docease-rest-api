// const CyclicDB = require('@cyclic.sh/dynamodb')
// const db = CyclicDB('dull-lime-cod-robeCyclicDB')
// // const bcrypt = require('bcrypt');
// // const saltRounds = 10;

// // const params = {
// //     TableName: 'students',
// //     KeySchema: [
// //       {
// //         AttributeName: 'Accessnumber',
// //         KeyType: 'HASH'
// //       },
// //       {
// //         AttributeName: 'firstname',
// //         KeyType: 'RANGE'
// //       },
// //       {
// //         AttributeName: 'lastname',
// //         KeyType: 'RANGE'
// //       },
// //       {
// //         AttributeName: 'phonenumber',
// //         KeyType: 'RANGE'
// //       },
// //       {
// //         AttributeName: 'Password',
// //         KeyType: 'RANGE'
  
// //       }
  
// //     ],
// //     AttributeDefinitions: [
// //       {
// //         AttributeName: 'Accessnumber',
// //         AttributeType: 'S'
// //       },
// //       {
// //         AttributeName: 'firstname',
// //         AttributeType: 'S'
// //       },
// //       {
// //         AttributeName: 'lastname',
// //         AttributeType: 'S'
// //       },
// //       {
// //         AttributeName: 'phonenumber',
// //         AttributeType: 'S'
// //       },
  
// //       {
// //         AttributeName: 'Password',
// //         AttributeType: 'S'
// //       }
// //     ],
// //     ProvisionedThroughput: {
// //       ReadCapacityUnits: 10,
// //       WriteCapacityUnits: 10
// //     }
// //   }
  
// //   db.createTable(params, (err, data) => {
// //     if (err) {
// //       console.error('Unable to create table. Error JSON:', JSON.stringify(err, null, 2))
// //     } else {
// //       console.log('Created table. Table description JSON:', JSON.stringify(data, null, 2))
// //     }
// //   });

// //   bcrypt.hash('user_password', saltRounds, function(err, hash) {
// //     if (err) throw err;
  
// //     // Store the hash in the database (e.g., DynamoDB)
// //     // ...
  
// //     // When verifying the password (e.g., during user login):
// //     bcrypt.compare('user_password', hash, function(err, result) {
// //       if (err) throw err;
  
// //       if (result) {
// //         console.log('Password is correct.');
// //       } else {
// //         console.log('Invalid password.');
// //       }
// //     });
// //   });

// const run = async function(){
//     let animals = db.collection('animals')

//     // create an item in collection with key "leo"
//     let leo = await animals.set('leo', {
//         type:'cat',
//         color:'orange'
//     })

//     // get an item at key "leo" from collection animals
//     let item = await animals.get('leo')
//     console.log(item)
// }
// run()

const AWS = require("aws-sdk");
const s3 = new AWS.S3()

await s3.putObject({
    Body: JSON.stringify({key:"value"}),
    Bucket: "cyclic-dull-lime-cod-robe-eu-north-1",
    Key: "Allfiles/student.json",
}).promise()