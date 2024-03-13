from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/workout-plans', methods=['POST'])
def generate_workout_plan():
    # Extract user input from the request body
    data = request.get_json()
    goal = data.get('goal')
    fitness_level = data.get('fitness_level')
    workout_days = data.get('workout_days')
    
    # Placeholder for the machine learning logic
    # Here, you will process the input and generate the workout plan
    # For now, let's return a mock response
    mock_response = {
        'user_input': {
            'goal': goal,
            'fitness_level': fitness_level,
            'workout_days': workout_days
        },
        'plan': 'This is where the personalized workout plan will be returned.'
    }
    
    return jsonify(mock_response)

@app.route('/')
def home():
    return "The Flask server is running. Use the /api/workout-plans endpoint to post data."


if __name__ == '__main__':
    app.run(debug=True, port=5000)