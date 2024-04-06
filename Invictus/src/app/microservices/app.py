from flask import Flask, request, jsonify
import pandas as pd
from pymongo import MongoClient

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
    
    return jsonify(workout_plan)

def fetch_user_preferences(email):
    client = MongoClient('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net/Users')
    db = client['ClusterFYP']
    users = db['Users']
    user_data = users.find_one({'email': email})
    
    if user_data:
        return {
            "goal": user_data['goal'],
            "fitnessLevel": user_data['fitnessLevel'],
            "workoutDays": user_data['workoutDays']
        }
    else:
        return None  # Handle the case where no user data is found

def create_workout_plan(user_preferences, df):
    # Filter by Goal
    goal_filter = 'Type_' + user_preferences['goal'].capitalize()
    filtered_df = df[df[goal_filter] == 1]
    
    # Filter by Fitness Level
    fitness_level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    fitness_level = fitness_level_map.get(user_preferences['fitnessLevel'], 0)
    filtered_df = filtered_df[filtered_df['Level'] == fitness_level]
    
    # Select exercises based on workoutDays and distribute muscle groups
    # This is a simplified approach. You should adapt it to your requirements.
    if user_preferences['workoutDays'] == 1:
        selected_exercises = filtered_df.sample(n=6)
    elif user_preferences['workoutDays'] == 2:
        # Example: split by muscle group and pick 3 from each for two days
        muscle_groups = filtered_df['MuscleGroup'].unique()[:2]  # Simplified selection
        selected_exercises = {mg: filtered_df[filtered_df['MuscleGroup'] == mg].sample(n=3) for mg in muscle_groups}
    elif user_preferences['workoutDays'] == 3:
        # Adjust logic accordingly
        muscle_groups = filtered_df['MuscleGroup'].unique()[:3]
        selected_exercises = {mg: filtered_df[filtered_df['MuscleGroup'] == mg].sample(n=2) for mg in muscle_groups}
    
    return selected_exercises

def map_fitness_level(fitness_level):
    # Map fitness level from string to corresponding numeric code if needed
    levels = {"beginner": 0, "intermediate": 1, "advanced": 2}
    return levels.get(fitness_level.lower(), 0)

def select_exercises(filtered_df, workout_days):
    # Placeholder for selecting exercises based on workout days
    # Implement your logic here based on the requirements
    return ["Exercise 1", "Exercise 2"]  # Example

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)