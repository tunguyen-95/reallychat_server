const express = require('express');
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const Sse = require('json-sse');
const cors = require('cors');

const stream = new Sse();

databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:secret@localhost:5432/postgres';
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
const jsonParser = bodyParser.json();
app.use(jsonParser);

const db = new Sequelize(databaseUrl);

//Chatroom database stuff
const Chatroom = db.define('chatroom', {
  message: Sequelize.STRING,
  user: Sequelize.STRING
});

db.sync({ force: false })
  .then(() => console.log('database synced'))
  .catch(error => console.log('got an error', error));

app.get('/', (request, response) => {
  console.log('got a get request on /');
  response.status(200);
  response.send('hello world');
});

app.post('/message', async (request, response) => {
  console.log('got a request on /message', request.body);
  const { message } = request.body;
  const entity = await Chatroom.create({
    message, //equal to message: message
    user: "it's me"
  });

  const room = await Chatroom.findAll();
  const data = JSON.stringify(room);
  stream.send(data);

  response.status(200);
  response.send('Thanks for your message');
});

app.get('/stream', async (request, response) => {
  console.log('got a request on stream');
  const room = await Chatroom.findAll();
  const data = JSON.stringify(room);
  console.log('messages in this room are', data);

  stream.updateInit(data);
  stream.init(request, response);
});

app.listen(port, () => console.log(`listening on port ${port}`));
