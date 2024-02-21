from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/api/workout-plans', methods=['POST'])
def generate_workout_plan():
    data = request.json
    goal = data.get('goal')
    fitness_level = data.get('fitness_level')
    workout_days = data.get('workout_days')
    
    # Your machine learning logic here
    # For now, let's return a mock response
    response = {
        'plan': 'Here will be your workout plan based on: ' + str(goal) + ', ' + str(fitness_level) + ', ' + str(workout_days)
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)