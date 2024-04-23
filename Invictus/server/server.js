const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');

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
  email: String,
  workouts: [dayPlanSchema],
  goal: String,
  fitnessLevel: String
}, { collection: 'workout_plans' });  // Explicitly specifying the collection name



const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
const User = mongoose.model('User', userSchema);

//app post
app.post('/tabs/trainer', async (req, res) => {
  const query = { email: req.body.email };
  const update = {
    $set: {
      height: req.body.height,
      weight: req.body.weight,
      age: req.body.age,
      gender: req.body.gender,
      goal: req.body.goal,
      fitnessLevel: req.body.fitnessLevel,
      workoutDays: req.body.workoutDays
    }
  };
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };

  try {
    const user = await User.findOneAndUpdate(query, update, options);
    res.json(user);
  } catch (error) {
    console.error('Error updating or creating user data:', error);
    res.status(500).send('Error updating or creating user data');
  }
});

// Get user data
app.get('/tabs/profile/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const result = await User.aggregate([
      { $match: { email } },
      {
        $lookup: {
          from: "workout_plans",
          localField: "email",
          foreignField: "email",
          as: "workoutPlan"
        }
      },
      { $unwind: { path: "$workoutPlan", preserveNullAndEmptyArrays: true } } // preserves users without workout plans
    ]);

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({ message: 'Error retrieving user and workout plan data' });
  }
});

app.get('/tabs/trainer/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    if (user) {
      // Fetching associated weight logs
      const weightLogs = await WeightLog.findOne({ email: email }).sort({'weights.date': -1});
      const userData = user.toObject();  // Convert Mongoose document to plain object
      userData.weights = weightLogs ? weightLogs.weights : [];  // Add weight logs to user data
      res.json(userData);
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

const weightLogSchema = new mongoose.Schema({
  email: String,
  weights: [{
    date: Date,
    weight: Number
  }]
});

const WeightLog = mongoose.model('WeightLog', weightLogSchema);

app.post('/update-weight', async (req, res) => {
  const { email, weight } = req.body;
  const result = await WeightLog.findOneAndUpdate(
    { email: email },
    { $push: { weights: { date: new Date(), weight: weight } } },
    { new: true, upsert: true }
  );
  res.json(result);
});


// Define the job to check workout plan adjustments
cron.schedule('*/2 * * * *', async () => {
  console.log('Running the check for workout plan adjustment every two minutes');

  const users = await User.find(); // Get all users

  for (let user of users) {
    // Find the latest two weight logs for each user
    const weightLogs = await WeightLog.findOne({ email: user.email }).sort({ 'weights.date': -1 });

    if (weightLogs && weightLogs.weights.length > 1) {
      const [latestLog, previousLog] = weightLogs.weights.slice(-2);
      const timeDiff = new Date(latestLog.date).getTime() - new Date(previousLog.date).getTime();
      const twoMinutes = 2 * 60 * 1000; // Two minutes in milliseconds

      // Check if the latest weight log is older than two minutes and adjust the workout plan if necessary
      if (timeDiff > twoMinutes) {
        // Logic to adjust workout plan based on the weight trend and user's goal
        console.log(`Suggesting workout plan adjustment for user ${user.email}`);
        // Here, you could call a function to update the workout plan or send a notification to the user
      }
    }
  }
});



