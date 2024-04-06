from flask import Flask, request, jsonify
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import random

app = Flask(__name__)

# Load your dataset
df = pd.read_csv('../../assets/Gym_Dataset.csv')

@app.route('/api/workout-plans', methods=['POST'])
def generate_workout_plan():
    data = request.get_json()
    
    # Assuming data includes 'email', which you can use to query MongoDB for user preferences
    user_preferences = fetch_user_preferences(data['email'])

    if not user_preferences:
        return jsonify({"error": "User preferences not found"}), 404
    
    # Assuming `df` is your DataFrame loaded globally or within this function
    workout_plan = create_workout_plan(user_preferences, df)

    # Convert pandas DataFrame to JSON for the response, if necessary
    # This depends on how you're planning to use `selected_exercises`
    plan_json = workout_plan.to_json(orient="records") if isinstance(workout_plan, pd.DataFrame) else workout_plan
    
    return jsonify(plan_json)

def fetch_user_preferences(email):
    client = None
    try:
        client = MongoClient('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net')
        db = client['Users']
        users = db['users']
        user_data = users.find_one({'email': email})
        
        if user_data:
            return {
                "goal": user_data['goal'],
                "fitnessLevel": user_data['fitnessLevel'],
                "workoutDays": user_data['workoutDays']
            }
        else:
            return None  # Handle the case where no user data is found
    except PyMongoError as e:
        print(f"MongoDB error: {e}")
        return None
    finally:
        if client:
            client.close()

def create_workout_plan(user_preferences, df):
    # Map the goal from MongoDB to the correct DataFrame column name
    goal_map = {
        "loseWeight": "Type_Cardio",
        "gainMuscle": "Type_Strength"
    }
    goal_column = goal_map.get(user_preferences['goal'], None)

    if goal_column is None or goal_column not in df.columns:
        # Handle the case where the goal does not match expected values
        print(f"Goal column {goal_column} is not recognized in the DataFrame.")
        return []

    # Proceed with filtering using the correct column name
    filtered_df = df[df[goal_column] == 1]
    
    # Filter by Fitness Level
    fitness_level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    fitness_level = fitness_level_map.get(user_preferences['fitnessLevel'], 0)
    filtered_df = filtered_df[filtered_df['Level'] == fitness_level]
    
    # Select exercises based on workoutDays and distribute muscle groups
    # This is a simplified approach. You should adapt it to your requirements.
    # Define your body parts based on the columns available in your DataFrame
    body_parts = ['Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves', 'Chest', 'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back', 'Middle Back', 'Neck', 'Quadriceps', 'Shoulders', 'Traps', 'Triceps']
    
    selected_exercises = []

    # Assuming user_preferences['workoutDays'] is an integer 1, 2, or 3
    exercises_per_day = 6
    days = int(user_preferences['workoutDays'])
    exercises_per_muscle = exercises_per_day // days
    
    # Shuffle the body parts to randomize which ones are chosen
    random.shuffle(body_parts)
    
    for day in range(days):
        day_exercises = 0  # Counter for exercises added each day
        for body_part in body_parts:
            exercises_for_bodypart = filtered_df[filtered_df[f'BodyPart_{body_part}'] == 1]
            available_exercises = len(exercises_for_bodypart)
            
            if not exercises_for_bodypart.empty and day_exercises < exercises_per_day:
                sample_size = min(available_exercises, exercises_per_muscle)
                selected_exercises.append(exercises_for_bodypart.sample(n=sample_size))
                day_exercises += sample_size
        
        if day_exercises < exercises_per_day:
            print(f"Not enough exercises for day {day+1}. Found {day_exercises}, needed {exercises_per_day}.")

    # Convert list of DataFrames to a single DataFrame
    selected_exercises_df = pd.concat(selected_exercises)
    return selected_exercises_df
def select_exercises(filtered_df, workout_days):
    # Placeholder for selecting exercises based on workout days
    # Implement your logic here based on the requirements
    return ["Exercise 1", "Exercise 2"]  # Example

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)