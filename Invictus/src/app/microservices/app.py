from flask import Flask, request, jsonify
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import random
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

# Load your dataset
df = pd.read_csv('../../assets/Gym_Dataset.csv')

@app.route('/api/workout-plans', methods=['POST'])
def generate_workout_plan():
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    user_preferences = fetch_user_preferences(email)
    if not user_preferences:
        return jsonify({"error": "User preferences not found"}), 404
    
    workout_plan_df = create_workout_plan(user_preferences, df)
    cleaned_workout_plan = clean_up_exercises(workout_plan_df)
    save_workout_plan_to_mongodb(cleaned_workout_plan, email, user_preferences['goal'], user_preferences['fitnessLevel'])
    
    return jsonify(cleaned_workout_plan)

def clean_up_exercises(workout_plan):
    cleaned_workout_plan = []
    
    for day_plan in workout_plan:
        day = day_plan['Day']
        exercises = day_plan['Exercises']
        cleaned_exercises = []
        
        for exercise in exercises:
            cleaned_exercise = {
                "Title": exercise['Title'],
                "Equipment": exercise['Equipment'],
                "BodyParts": exercise.get('BodyParts', [])  # Assuming 'BodyParts' is a list in your dataset
            }
            cleaned_exercises.append(cleaned_exercise)
        
        cleaned_workout_plan.append({
            "Day": day,
            "Exercises": cleaned_exercises
        })
    
    return cleaned_workout_plan

def save_workout_plan_to_mongodb(cleaned_workout_plan, user_email, user_goal, user_level):
    client = MongoClient('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net')
    db = client['Users']
    workout_plans = db['workout_plans']
    
    
    workout_plans.update_one(
        {'email': user_email},
        {'$set': {
            'email': user_email,
            'goal': user_goal,  # Save user's goal
            'level': user_level,  # Save user's level
            'workouts': cleaned_workout_plan
        }},
        upsert=True
    )
    client.close()

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
    goal = user_preferences['goal']
    fitness_level = user_preferences['fitnessLevel']
    days = int(user_preferences['workoutDays'])

    if goal == "loseWeight":
        return create_cardio_plan(df, days, fitness_level)
    else:
        return create_strength_plan(df, goal, fitness_level, days)

def create_cardio_plan(df, days, fitness_level):
    # Convert fitness level to an index: beginner (0), intermediate (1), advanced (2)
    fitness_level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    level_index = fitness_level_map.get(fitness_level, 0)

    # Filter for cardio exercises that match the user's fitness level
    cardio_df = df[(df['Type_Cardio'] == 1) & (df['Level'] == level_index)]
    exercises_per_day = 6  # Always 6 exercises per day

    selected_exercises = []
    for day in range(1, days + 1):
        day_exercises = {'Day': day, 'Exercises': []}
        
        if len(cardio_df) < exercises_per_day:
            # If there are fewer cardio exercises available than required per day, allow replacement
            indices = np.random.choice(cardio_df.index, size=exercises_per_day, replace=True)
        else:
            # If sufficient exercises are available, prefer no replacement but allow if necessary
            indices = np.random.choice(cardio_df.index, size=exercises_per_day, replace=False)

        for idx in indices:
            exercise = cardio_df.loc[idx]
            exercise_details = {
                "Title": exercise['Title'],
                "Equipment": exercise['Equipment'],
                "BodyParts": [bp.replace('BodyPart_', '') for bp in df.columns if 'BodyPart_' in bp and exercise[bp] == 1]
            }
            day_exercises['Exercises'].append(exercise_details)

        selected_exercises.append(day_exercises)

    return selected_exercises

def create_strength_plan(df, goal, fitness_level, days):
    goal_map = {
        "gainMuscle": "Type_Strength"
    }
    goal_column = goal_map.get(goal, "Type_Strength")
    fitness_level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    level_index = fitness_level_map.get(fitness_level, 0)

    filtered_df = df[(df[goal_column] == 1) & (df['Level'] == level_index)]
    all_body_parts = [col.replace('BodyPart_', '') for col in df.columns if 'BodyPart_' in col and filtered_df[col].any()]

    muscle_groups_per_day = {
        1: 6,  # For 1 workout day per week: 6 muscle groups, 1 exercise each
        2: 3,  # For 2 workout days per week: 3 muscle groups, 2 exercises each
        3: 2   # For 3 workout days per week: 2 muscle groups, 3 exercises each
    }.get(days, 6)  # Default to 6 muscle groups per day if days are not 1, 2, or 3

    exercises_per_muscle_group = {
        1: 1,
        2: 2,
        3: 3
    }.get(days, 1)  # Default to 1 exercise per muscle group if days are not 1, 2, or 3

    selected_exercises = []
    used_body_parts = set()  # Set to track used body parts across all days

    for day in range(1, days + 1):
        day_exercises = {'Day': day, 'Exercises': []}
        available_body_parts = [bp for bp in all_body_parts if bp not in used_body_parts]
        random.shuffle(available_body_parts)  # Shuffle available body parts for variety

        for body_part in available_body_parts[:muscle_groups_per_day]:
            exercises_for_body_part = filtered_df[filtered_df[f'BodyPart_{body_part}'] == 1]
            available_exercises = min(len(exercises_for_body_part), exercises_per_muscle_group)
            if not exercises_for_body_part.empty:
                selected = exercises_for_body_part.sample(n=available_exercises, replace=False).to_dict('records')
                for exercise in selected:
                    exercise_details = {
                        "Title": exercise['Title'],
                        "Equipment": exercise['Equipment'],
                        "BodyParts": [body_part]
                    }
                    day_exercises['Exercises'].append(exercise_details)
                used_body_parts.add(body_part)  # Mark this body part as used

        selected_exercises.append(day_exercises)

    return selected_exercises



@app.route('/tabs/trainer', methods=['POST'])
def update_user_details():
    data = request.get_json()
    email = data.get('email')
    
    # Add logic to update user details in the database
    # This is pseudocode; adjust according to your actual data schema
    update_user_data(email, data)

    # Now also create a weight log entry
    weight = data.get('weight')
    if weight:  # Only create a log if weight is provided
        create_or_update_weight_log(email, weight)

    return jsonify({"status": "success"}), 200

def update_user_data(email, data):
    client = MongoClient('<your-mongodb-connection-string>')
    db = client['Users']
    users = db['users']
    
    # Update the user's data
    users.update_one({'email': email}, {'$set': data}, upsert=True)
    client.close()

def create_or_update_weight_log(email, weight):
    client = MongoClient('<your-mongodb-connection-string>')
    db = client['Users']
    weight_logs = db['weight_logs']
    
    # Create or update the latest weight log entry
    weight_logs.update_one(
        {'email': email},
        {'$set': {
            'weight': weight,
            'date': datetime.now()  # Use the server's datetime
        }},
        upsert=True
    )
    client.close()

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)