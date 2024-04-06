from flask import Flask, request, jsonify
import pandas as pd

app = Flask(__name__)

# Load your dataset
df = pd.read_csv('../../assets/Gym_Dataset.csv')

@app.route('/api/workout-plans', methods=['POST'])
def generate_workout_plan():
    data = request.get_json()
    goal = data.get('goal')  # 'Cardio' or 'Strength'
    fitness_level = data.get('fitness_level')  # 'Beginner', 'Intermediate', 'Advanced'
    workout_days = data.get('workout_days')
    
    # Filter exercises based on goal and fitness level
    filtered_df = df[(df[f'Type_{goal}'] == 1) & (df['Level'] == fitness_level)]
    
    # Placeholder for logic to select exercises based on workout days
    # This is where you'll implement the selection and distribution logic
    selected_exercises = select_exercises(filtered_df, workout_days)
    
    # Build the response
    workout_plan = {
        'user_input': {
            'goal': goal,
            'fitness_level': fitness_level,
            'workout_days': workout_days
        },
        'selected_exercises': selected_exercises  # This will be the list of exercises
    }
    
    return jsonify(workout_plan)

def select_exercises(filtered_df, workout_days):
    # Implement the logic here to select and distribute exercises across workout days
    # This is a placeholder function to be replaced with your actual selection logic
    return ["Exercise 1", "Exercise 2"]  # Example return value

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."

if __name__ == '__main__':
    app.run(debug=True, port=5000)