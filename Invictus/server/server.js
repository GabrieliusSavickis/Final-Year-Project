const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const db = mongoose.connection;
const moment = require('moment');

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

// Create a model from the workout plan schema
const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);
// Create a model from the user schema
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

// Define a GET endpoint to fetch user data along with their workout plan
app.get('/tabs/profile/:email', async (req, res) => {
  try {
    // Extract the email from the request parameters and convert it to lowercase
    const email = req.params.email.toLowerCase();

    // Use MongoDB's aggregation framework to fetch user data along with their workout plan
    const result = await User.aggregate([
      { $match: { email } }, // Match the user with the given email
      {
        $lookup: { // Perform a left outer join with the workout_plans collection
          from: "workout_plans",
          localField: "email",
          foreignField: "email",
          as: "workoutPlan"
        }
      },
      { $unwind: { path: "$workoutPlan", preserveNullAndEmptyArrays: true } } // Flatten the array of workout plans and preserve users without workout plans
    ]);

    // If a user is found, return the user data, otherwise return a 404 status code
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    // Log the error and return a 500 status code if there is an error
    console.error('Aggregation error:', error);
    res.status(500).json({ message: 'Error retrieving user and workout plan data' });
  }
});

// Define a GET endpoint to fetch user data along with their weight logs
app.get('/tabs/trainer/:email', async (req, res) => {
  try {
    // Extract the email from the request parameters
    const email = req.params.email;

    // Fetch the user data
    const user = await User.findOne({ email: email });

    // If a user is found, fetch their weight logs and return the user data along with the weight logs
    if (user) {
      const weightLogs = await WeightLog.findOne({ email: email }).sort({ 'weights.date': -1 });
      const userData = user.toObject();  // Convert the Mongoose document to a plain object
      userData.weights = weightLogs ? weightLogs.weights : [];  // Add the weight logs to the user data
      res.json(userData);
    } else {
      // If a user is not found, return a 404 status code
      res.status(404).send('User not found');
    }
  } catch (error) {
    // Log the error and return a 500 status code if there is an error
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Define a POST endpoint to update or create user data
app.post('/tabs/profile/update', async (req, res) => {
  // Define the query, update, and options for the findOneAndUpdate method
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

// Define the schema for workout metrics
const workoutMetricsSchema = new mongoose.Schema({
  userId: String, // The ID of the user
  workoutDays: [String], // The days when the user worked out
  workoutStartTime: Number, // The start time of the workout
  workoutEndTime: Number, // The end time of the workout
  durationInSeconds: Number, // The duration of the workout in seconds
  weeklyWorkoutTimeInSeconds: Number, // The total workout time in a week in seconds
  dateLogged: { type: Date, default: Date.now } // The date when the metrics were logged
}, {
  collection: 'workout_metrics' // Explicitly specify the collection name in the database
});

// Create a model from the workout metrics schema
const WorkoutMetrics = mongoose.model('WorkoutMetrics', workoutMetricsSchema);

// Define a POST endpoint for saving workout metrics
app.post('/api/workout-metrics', async (req, res) => {
  const { userId, workoutDays, workoutStartTime, workoutEndTime, durationInSeconds } = req.body;

  try {
    // Convert string values to numbers if necessary.
    const metrics = new WorkoutMetrics({
      userId,
      workoutDays,
      workoutStartTime: parseInt(workoutStartTime), // Convert the start time to a number
      workoutEndTime: parseInt(workoutEndTime), // Convert the end time to a number
      durationInSeconds: parseFloat(durationInSeconds), // Convert the duration to a number
    });

    const savedMetrics = await metrics.save();
    res.status(201).json(savedMetrics);
  } catch (error) {
    console.error('Error saving workout metrics:', error);
    res.status(500).send('Failed to save workout metrics');
  }
});

// Define a GET endpoint to fetch the workout days for a user in a week
app.get('/api/workout-days/:email', async (req, res) => {
  try {
    const email = req.params.email; // Extract the email from the request parameters
    const startOfWeek = moment().startOf('week').toDate(); // Get the start of the week
    const endOfWeek = moment().endOf('week').toDate(); // Get the end of the week

    // Fetch the workouts for the user in the given week and sort them by date
    const workouts = await WorkoutMetrics.find({
      userId: email,
      dateLogged: { $gte: startOfWeek, $lte: endOfWeek }
    }).sort({ dateLogged: 1 });

    // Map the workouts to their days and return unique days only
    const workoutDays = workouts.map(w => moment(w.dateLogged).format('dd'));
    res.json([...new Set(workoutDays)]);
  } catch (error) {
    // Log the error and return a 500 status code if there is an error
    console.error('Error retrieving workout days:', error);
    res.status(500).json({ message: 'Error retrieving workout days' });
  }
});

// Define a GET endpoint to fetch the total workout time for a user in a week
app.get('/api/weekly-workout-time/:email', async (req, res) => {
  try {
    const email = req.params.email; // Extract the email from the request parameters
    const startOfWeek = moment().startOf('isoWeek'); // Get the start of the ISO week (Monday as the first day of the week)
    const endOfWeek = moment().endOf('isoWeek'); // Get the end of the ISO week

    // Fetch the workouts for the user in the given week
    const workouts = await WorkoutMetrics.find({
      userId: email,
      dateLogged: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() }
    });

    // Calculate the total workout time in seconds
    const weeklyWorkoutTimeInSeconds = workouts.reduce((total, workout) => {
      return total + workout.durationInSeconds;
    }, 0);

    // Return the total workout time in seconds
    res.json({ weeklyWorkoutTimeInSeconds });
  } catch (error) {
    // Log the error and return a 500 status code if there is an error
    console.error('Error retrieving weekly workout time:', error);
    res.status(500).json({ message: 'Error retrieving weekly workout time' });
  }
});

// Define the schema for exercise completion
const exerciseCompletionSchema = new mongoose.Schema({
  userId: String, // The ID of the user
  exerciseTitle: String, // The title of the exercise
  isCompleted: Boolean, // Whether the exercise is completed
  timestamp: Date, // The timestamp of the completion
});

// Create a model from the exercise completion schema
const ExerciseCompletion = mongoose.model('ExerciseCompletion', exerciseCompletionSchema);

// Create a model from the exercise completion schema

// Define the schema for workout completion
const workoutCompletionSchema = new mongoose.Schema({
  userId: String, // The ID of the user
  dayCompleted: Date, // The date when the workout was completed
  workoutId: mongoose.Schema.Types.ObjectId, // The ID of the completed workout
});

// Create a model from the workout completion schema
const WorkoutCompletion = mongoose.model('WorkoutCompletion', workoutCompletionSchema);


// Define a POST endpoint for logging workout completion
app.post('/api/log-workout-completion', async (req, res) => {
  try {
    // Create a new workout completion document from the request body
    const completion = new WorkoutCompletion(req.body);
    // Save the workout completion document
    await completion.save();
    // Send the saved document as the response
    res.status(201).json(completion);
  } catch (error) {
    // Log the error and send a 500 status code if there is an error
    console.error('Error logging workout completion:', error);
    res.status(500).json({ message: 'Error logging workout completion' });
  }
});

// Define a GET endpoint for fetching the weekly workout summary
app.get('/api/weekly-workout-summary', async (req, res) => {
  console.log("Request received for weekly workout summary");
  try {
    // Define the start and end of the ISO week (Monday as the first day of the week)
    const startOfWeek = moment().startOf('isoWeek').toDate();
    const endOfWeek = moment().endOf('isoWeek').toDate();

    // Use MongoDB's aggregation framework to fetch the weekly workout summary
    const result = await WorkoutMetrics.aggregate([
      {
        $match: {
          dateLogged: { $gte: startOfWeek, $lte: endOfWeek } // Match workouts in the given week
        }
      },
      {
        $project: {
          dayOfWeek: { $dayOfWeek: '$dateLogged' }, // Project the day of the week
          durationInSeconds: 1, // Project the duration in seconds
          workoutStartTime: { $toLong: "$workoutStartTime" }, // Convert the start time to a long
          workoutEndTime: { $toLong: "$workoutEndTime" } // Convert the end time to a long
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalDuration: { $sum: '$durationInSeconds' },
          // Calculate the average start and end times of the workouts
          averageStartTime: { $avg: '$workoutStartTime' },
          averageEndTime: { $avg: '$workoutEndTime' },
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Map the results to include the calculated average workout time and convert day numbers to names
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const enhancedResults = result.map(day => {
      console.log(`Raw start and end times: ${day.averageStartTime}, ${day.averageEndTime}`);
      // Calculate the average duration of the workouts
      const averageDuration = (day.averageEndTime - day.averageStartTime) / 1000;
      const enhancedDay = {
        dayOfWeek: dayNames[day._id - 1], // Convert the day number to a name
        totalDuration: day.totalDuration,
        averageDuration: isNaN(averageDuration) ? 0 : averageDuration
      };
      console.log(`Day: ${enhancedDay.dayOfWeek}, Average Duration: ${enhancedDay.averageDuration}`);
      return enhancedDay;
    });

    console.log('Enhanced Results:', enhancedResults);
    res.json(enhancedResults);
  } catch (error) {
    console.error('Error retrieving weekly workout summary:', error);
    res.status(500).json({ message: 'Error retrieving weekly workout summary' });
  }
});

// Define the schema for nutrition plans
const nutritionPlanSchema = new mongoose.Schema({
  email: String, // The email of the user
  calories: Number, // The number of calories in the nutrition plan
  protein: Number, // The amount of protein in the nutrition plan
  fats: Number, // The amount of fats in the nutrition plan
}, { collection: 'nutrition_plans' }); // Explicitly specify the collection name in the database

// Create a model from the nutrition plan schema
const NutritionPlan = mongoose.model('NutritionPlan', nutritionPlanSchema);

// Define a GET endpoint to fetch a user's nutrition plan by email
app.get('/api/nutrition-plans/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const nutritionPlan = await NutritionPlan.findOne({ email: email.toLowerCase() });
    console.log('Nutrition Plan Found:', nutritionPlan);

    if (nutritionPlan) {
      res.status(200).json(nutritionPlan);
    } else {
      res.status(404).send({ message: 'Nutrition plan not found for the provided email' });
    }
  } catch (error) {
    console.error('Failed to fetch nutrition plan:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// Define the schema for intensity decisions
const intensityDecisionSchema = new mongoose.Schema({
  email: String, // The email of the user
  increaseIntensity: Boolean, // Whether to increase the intensity of the workout
  timestamp: { type: Date, default: Date.now }, // The timestamp of the decision
}, { collection: 'intensity_decisions' }); // Explicitly specify the collection name in the database

// Create a model from the intensity decision schema
const IntensityDecision = mongoose.model('IntensityDecision', intensityDecisionSchema);

// Define a POST endpoint for logging intensity decisions
app.post('/api/log-intensity-decision', async (req, res) => {
  const { email, increaseIntensity } = req.body;

  // Perform input validation as needed

  try {
    // Use the correct model name 'IntensityDecision' to create a new document
    const intensityDecision = new IntensityDecision({
      email: email,
      increaseIntensity: increaseIntensity, // Note: Use the same field name as in the schema
      timestamp: new Date(), // This is optional since you have a default value in the schema
    });

    await intensityDecision.save();
    res.status(201).json({ message: 'Intensity decision logged' });
  } catch (error) {
    console.error('Error logging intensity decision:', error);
    res.status(500).json({ message: 'Error logging intensity decision' });
  }
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