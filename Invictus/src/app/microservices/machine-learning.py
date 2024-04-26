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



# Extracting the latest weight for each user
data['latest_weight'] = data['weights'].apply(lambda x: x[-1]['weight'] if isinstance(x, list) and x else np.nan)

# Assuming 'weights' is sorted by date in descending order, calculate weight change
# Calculate the change in weight only if there are at least two measurements
data['weight_change'] = data['weights'].apply(lambda x: x[-1]['weight'] - x[0]['weight'] if isinstance(x, list) and len(x) > 1 else 0)

# Normalizing data
data[['weight_change']] = scaler.fit_transform(data[['weight_change']])

# One-hot encoding for non-ordinal categorical variables
data = pd.get_dummies(data, columns=['gender', 'goal', 'fitnessLevel'], drop_first=True)

# Handling the 'increaseIntensity' as the target variable
data['intensity_decision'] = data['increaseIntensity'].apply(lambda x: 1 if x else 0)

y = data['intensity_decision']
x = data.drop(columns=['email', 'intensity_decision', 'timestamp', 'createdAt', 'updatedAt', 'weights'])

# Exporting the data to a CSV to check the merge and transformations
x.to_csv('merged_data_check.csv', index=False)

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

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