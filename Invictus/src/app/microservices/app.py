from flask import Flask, request, jsonify
import pandas as pd
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import random
from flask_cors import CORS

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
        return create_cardio_plan(df, days)
    else:
        return create_strength_plan(df, goal, fitness_level, days)

def create_cardio_plan(df, days):
    cardio_df = df[df['Type_Cardio'] == 1]  # Filter for cardio exercises

    total_exercises = len(cardio_df)
    exercises_per_day = max(6 // days, 1)  # Ensure at least one exercise if days > 6

    selected_exercises = []
    used_indices = set()

    for day in range(1, days + 1):
        day_exercises = {'Day': day, 'Exercises': []}

        for _ in range(exercises_per_day):
            while True:
                idx = random.randint(0, total_exercises - 1)
                if idx not in used_indices:
                    used_indices.add(idx)
                    break

            exercise = cardio_df.iloc[idx]
            body_parts = exercise.get('BodyParts', '').split(',') if 'BodyParts' in exercise else []
            exercise_details = {
                "Title": exercise['Title'],
                "Equipment": exercise['Equipment'],
                "BodyParts": [part.strip() for part in body_parts]
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
    muscle_groups = [col for col in df.columns if 'BodyPart_' in col]
    body_parts = [mg.split('_')[1] for mg in muscle_groups if filtered_df[mg].any()]

    muscle_groups_per_day = {
        1: 6,  # For 1 workout day per week
        2: 3,  # For 2 workout days per week
        3: 2   # For 3 workout days per week
    }.get(days, 2)  # Default to 2 groups per day if not 1, 2, or 3 days

    selected_exercises = []

    for day in range(1, days + 1):
        day_exercises = {'Day': day, 'Exercises': []}
        random.shuffle(body_parts)  # Shuffle body parts for variety

        for body_part in body_parts:
            if len(day_exercises['Exercises']) < muscle_groups_per_day:
                exercises_for_body_part = filtered_df[filtered_df[f'BodyPart_{body_part}'] == 1]
                selected = exercises_for_body_part.sample(n=3 if len(exercises_for_body_part) >= 3 else len(exercises_for_body_part)).to_dict('records')
                for exercise in selected:
                    exercise_details = {
                        "Title": exercise['Title'],
                        "Equipment": exercise['Equipment'],
                        "BodyParts": [bp.strip() for bp in exercise['BodyParts'].split(',')]
                    }
                    day_exercises['Exercises'].append(exercise_details)

        selected_exercises.append(day_exercises)

    return selected_exercises

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)