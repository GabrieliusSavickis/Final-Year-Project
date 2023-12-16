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
  await mongoose.connect('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net/Users');
  // using await because database has authentication
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const userSchema = mongoose.Schema({
  height: Number,
  weight: Number,
  email: String, // This is the email address of the user which we can uniquely identify them by
  phone: String,
  age: Number,
  gender: String,
}, {
  // Shows when changes are made to the data
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

//app post
app.post('/tabs/trainer', async (req, res) => {
  try {
    const user = new User({
      height: req.body.height,
      weight: req.body.weight,
    });
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send('Error saving user data'); //trying to catch the error
  }
});

// Get user data
app.get('/tabs/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.send(user);
  } catch (error) {
    res.status(500).send('Error retrieving user data');
  }
});

// Update user data
app.post('/tabs/profile/update', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ email: req.body.email }, req.body, { new: true });
    res.send(user);
  } catch (error) {
    res.status(500).send('Error updating user data');
  }
});

