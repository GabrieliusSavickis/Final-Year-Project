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
    
    # Generate the workout plan DataFrame
    workout_plan_df = create_workout_plan(user_preferences, df)  # Make sure to use this variable name

    # Clean the workout_plan DataFrame before converting to JSON
    cleaned_workout_plan = clean_up_exercises(workout_plan_df)
    
    # Save the cleaned workout plan to MongoDB
    user_goal = user_preferences['goal']
    user_level = user_preferences['fitnessLevel']
    save_workout_plan_to_mongodb(cleaned_workout_plan, data['email'], user_goal, user_level)
    
    # Convert cleaned exercises to JSON for the response
    plan_json = jsonify(cleaned_workout_plan)

    return plan_json

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
    
    # Replace 'user_email' with the field name you are using to reference the user
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
    # Maps user goal to dataset columns
    goal_map = {
        "loseWeight": "Type_Cardio",
        "gainMuscle": "Type_Strength"
    }
    goal_column = goal_map.get(user_preferences['goal'], "Type_Cardio")

    # Filter by goal and fitness level
    fitness_level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
    fitness_level = fitness_level_map.get(user_preferences['fitnessLevel'], 0)  # Adjusted to match CSV indexing starting at 0
    filtered_df = df[(df[goal_column] == 1) & (df['Level'] == fitness_level)]  # Ensure equality comparison for Level

    # Identify muscle groups from the dataset
    muscle_groups = [col for col in df.columns if 'BodyPart_' in col]
    body_parts = [mg.split('_')[1] for mg in muscle_groups if filtered_df[mg].any()]
    
    days = int(user_preferences['workoutDays'])
    muscle_groups_per_day = {
        1: 6,  # For 1 workout day
        2: 3,  # For 2 workout days
        3: 2   # For 3 workout days
    }[days]

    selected_exercises = []
    
    for day in range(1, days + 1):
        day_exercises = {'Day': day, 'Exercises': []}
        muscle_groups_covered = 0
        
        # It's important to shuffle body parts inside the loop to reset the selection for each day
        random.shuffle(body_parts)  

        for body_part in body_parts[:]:  # Iterate on a copy of body_parts to safely modify the original list
            if muscle_groups_covered < muscle_groups_per_day:
                exercises_for_body_part = filtered_df[filtered_df[f'BodyPart_{body_part}'] == 1]

                if not exercises_for_body_part.empty:
                    # Always select 3 exercises per muscle group
                    required_exercises = 3
                    selected = exercises_for_body_part.sample(n=min(len(exercises_for_body_part), required_exercises)).to_dict('records')
                    for exercise in selected:
                        # Extract body parts for the current exercise
                        body_parts_involved = [body_part.split('_')[1] for body_part in muscle_groups if exercise[body_part] == 1]
                        exercise_details = {
                            "Title": exercise['Title'],
                            "Equipment": exercise['Equipment'],
                            "BodyParts": body_parts_involved  # Add the list of body parts involved in this exercise
                        }
                        # Use exercise_details instead of 'selected' directly
                        day_exercises['Exercises'].append(exercise_details)
                    muscle_groups_covered += 1
                    # Remove the body part from future consideration to avoid duplication
                    body_parts.remove(body_part)

                if muscle_groups_covered == muscle_groups_per_day:
                    break  # Move to the next day once the muscle group target is met

        selected_exercises.append(day_exercises)
    
    return selected_exercises

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)