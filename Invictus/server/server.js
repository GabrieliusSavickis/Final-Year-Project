const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());

// Opens a connection to the database on our locally running instance of mongodb
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net/Users?retryWrites=true&w=majority');
  // using await because database has authentication
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const userSchema = mongoose.Schema({
  height: Number,
  weight: Number,
}, {
  // Shows when changes are made to the data
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

//app post
app.post('/users', async (req, res) => {
  const user = new User({
    height: req.body.height,
    weight: req.body.weight,
  });
  await user.save();
  res.send(user);
});

