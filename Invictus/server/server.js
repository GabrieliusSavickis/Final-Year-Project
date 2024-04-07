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
  goal: String,
  fitnessLevel: String,
  workoutDays: Number,
}, {
  // Shows when changes are made to the data
  timestamps: true,
});

// Schema for individual exercises, adjust according to your actual data model
const exerciseSchema = new mongoose.Schema({
  Title: String,
  Equipment: String,
  BodyParts: [String]
});

// Schema for daily workout plans
const dayPlanSchema = new mongoose.Schema({
  Day: Number,
  Exercises: [exerciseSchema]
});

// Main schema for the workout plan
const workoutPlanSchema = new mongoose.Schema({
  email: String, // Assuming there's an email field to link to the user
  workouts: [dayPlanSchema],
  goal: String,
  fitnessLevel: String
});


const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
const User = mongoose.model('User', userSchema);

//app post
app.post('/tabs/trainer', async (req, res) => {
  try {
    const user = new User({
      height: req.body.height,
      weight: req.body.weight,
      age: req.body.age, 
      gender: req.body.gender,
      goal: req.body.goal,
      fitnessLevel: req.body.fitnessLevel,
      workoutDays: req.body.workoutDays,
      email: req.body.email,
    });
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send('Error saving user data'); //trying to catch the error
  }
});

// Get user data
app.get('/tabs/profile/:email', async (req, res) => {
  // Example of using aggregation to join collections (simplified)
  try {
    const result = await User.aggregate([
      { $match: { email: req.params.email.toLowerCase() } },
      {
        $lookup: {
          from: "workout_plans",
          localField: "email",
          foreignField: "email",
          as: "workoutPlan"
        }
      },
      { $unwind: "$workoutPlan" }, // If you're sure there's only one workout plan per user
    ]);

    if (result && result.length) {
      console.log('Aggregation result:', result[0]);
      res.send(result[0]);
    } else {
      res.status(404).send('User or workout plan not found');
    }
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).send('Error retrieving user and workout plan data');
  }
});

app.get('/tabs/trainer/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/tabs/profile/update', async (req, res) => {
  const query = { email: req.body.email };
  const update = req.body;
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  try {
    const user = await User.findOneAndUpdate(query, update, options);
    res.send(user);
  } catch (error) {
    console.error('Error updating or creating user data:', error);
    res.status(500).send('Error updating or creating user data');
  }
});