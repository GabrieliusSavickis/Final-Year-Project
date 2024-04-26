import tensorflow as tf
from tensorflow import keras
from keras import models
from keras import layers

import numpy as np
import pandas as pd
from pymongo import MongoClient
from bson.objectid import ObjectId
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Function to fetch data from MongoDB
# Function to fetch data from MongoDB
def fetch_data_from_mongodb():
    client = MongoClient('mongodb+srv://invictus:invictusfyp@clusterfyp.3lmfd7v.mongodb.net')
    db = client['Users']
    
    # Fetch data from collections
    users_data = pd.DataFrame(list(db['users'].find())).drop(columns=['_id', '__v'])
    users_data = pd.get_dummies(users_data, columns=['gender', 'goal', 'fitnessLevel'], drop_first=True)
    workout_metrics_data = pd.DataFrame(list(db['workout_metrics'].find())).drop(columns=['_id', '__v'])
    weight_logs_data = pd.DataFrame(list(db['weightlogs'].find())).drop(columns=['_id', '__v'])
    intensity_decisions_data = pd.DataFrame(list(db['intensity_decisions'].find())).drop(columns=['_id', '__v'])
    workout_completions_data = pd.DataFrame(list(db['workoutcompletions'].find())).drop(columns=['_id', '__v'])

    # Close the MongoDB connection
    client.close()
    
    # Print the size of each DataFrame and a sample of the data
    print("Users Data:", users_data.shape)
    print(users_data.head())
    print("Workout Metrics Data:", workout_metrics_data.shape)
    print(workout_metrics_data.head())
    print("Weight Logs Data:", weight_logs_data.shape)
    print(weight_logs_data.head())
    print("Intensity Decisions Data:", intensity_decisions_data.shape)
    print(intensity_decisions_data.head())
    print("Workout Completions Data:", workout_completions_data.shape)
    print(workout_completions_data.head())

    
    return users_data, workout_metrics_data, weight_logs_data, intensity_decisions_data, workout_completions_data

users, workout_metrics, weight_logs, intensity_decisions, workout_completions = fetch_data_from_mongodb()

scaler = StandardScaler()

# Set workout_completion to 1 for each entry in workout_completions since they represent completed workouts
workout_completions['workout_completion'] = 1

# Assuming the renaming has been done
workout_completions.rename(columns={'userId': 'email'}, inplace=True)

# Merge operations
data = pd.merge(users, workout_completions, on='email', how='left')
print("After merging with workout_completions:", data.columns)
data = pd.merge(data, intensity_decisions, on='email', how='left')
print("After merging with intensity_decisions:", data.columns)
data = pd.merge(data, weight_logs, on='email', how='left')
print("After merging with weight_logs:", data.columns)

# Convert 'dayCompleted' to a numerical value: number of days since the earliest date in the column
earliest_day = pd.to_datetime(data['dayCompleted']).min()
data['days_since_earliest'] = (pd.to_datetime(data['dayCompleted']) - earliest_day).dt.days

# Handling the 'increaseIntensity' as the target variable
# We do this conversion before dropping the 'increaseIntensity' column
data['intensity_decision'] = data['increaseIntensity'].astype(int)

# Set your target variable 'y' before dropping the related column
y = data['intensity_decision']

# Drop the original non-numeric columns and any other columns not needed for training
X = data.drop(columns=['email', 'intensity_decision', 'timestamp', 'createdAt', 'updatedAt', 'weights', 'dayCompleted', 'increaseIntensity'])

# Extracting the latest weight for each user
# Ensure weights are sorted by date if you have multiple entries
data['latest_weight'] = data['weights'].apply(lambda x: x[-1]['weight'] if isinstance(x, list) and x else np.nan)

# Assuming 'weights' is sorted by date in descending order, calculate weight change
# Calculate the change in weight only if there are at least two measurements
data['weight_change'] = data['weights'].apply(lambda x: x[-1]['weight'] - x[0]['weight'] if isinstance(x, list) and len(x) > 1 else 0)

# Normalize 'weight_change' and 'days_since_earliest'
data[['weight_change', 'days_since_earliest']] = scaler.fit_transform(data[['weight_change', 'days_since_earliest']])

# Exporting the data to a CSV to check the merge and transformations
X.to_csv('merged_data_check.csv', index=False)

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)


# Define the model
model = keras.Sequential([
    layers.Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    layers.Dense(64, activation='relu'),
    layers.Dense(1, activation='sigmoid')  # Sigmoid activation for binary classification
])

# Compile the model
model.compile(
    optimizer='adam',  # Adam is a good default optimizer to start with
    loss='binary_crossentropy',  # Appropriate for binary classification
    metrics=['accuracy']  # Accuracy is a common metric for classification tasks
)

# Train the model
history = model.fit(
    X_train,
    y_train,
    epochs=50,  # You may want to adjust the number of epochs
    batch_size=32,  # Batch size is the number of samples per gradient update
    validation_split=0.2  # Use part of the training data as validation data
)

# Evaluate the model
test_loss, test_accuracy = model.evaluate(X_test, y_test)
print(f"Test Accuracy: {test_accuracy}")

# Use the model to make predictions
predictions = model.predict(X_test)

model.save('intensity_decision_model.h5')
