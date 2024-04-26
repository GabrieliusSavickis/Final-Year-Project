from flask import Flask, jsonify
from tensorflow import keras
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the pre-trained model
model = keras.models.load_model('intensity_decision_model.keras')

@app.route('/predict-intensity', methods=['GET'])
def predict_intensity():
    # Load your data
    data = pd.read_csv('merged_data_check.csv')
    print(data.columns)

    # Optionally, select a specific row to simulate a prediction
    # For example, use the first row in the dataset
    sample_input = data.iloc[0:1]  # Use :1 to keep the shape as (1, n_features)

    # Ensure the input is in the correct shape as the model expects
    if 'intensity_decision' in data.columns:
        sample_input = data.drop(columns=['intensity_decision'])
    else:
        sample_input = data
    # Predict using the model
    prediction = model.predict(sample_input)
    prediction_result = {'increase_intensity': bool(prediction[0] > 0.5)}  # Convert to True/False


    # Print the prediction result
    print("Prediction result:", prediction_result)
    # Return the result as JSON
    return jsonify(prediction_result)

if __name__ == '__main__':
    app.run(debug=True)