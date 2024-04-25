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
    users_data = pd.DataFrame(list(db['users'].find()))
    workout_metrics_data = pd.DataFrame(list(db['workout_metrics'].find()))
    weight_logs_data = pd.DataFrame(list(db['weightlogs'].find()))
    intensity_decisions_data = pd.DataFrame(list(db['intensity_decisions'].find()))
    workout_completions_data = pd.DataFrame(list(db['workoutcompletions'].find()))

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

# Remove unwanted columns from each DataFrame before merging
users = users.drop(columns=['_id', '__v'])
workout_metrics = workout_metrics.drop(columns=['_id', '__v'])
weight_logs = weight_logs.drop(columns=['_id', '__v'])
intensity_decisions = intensity_decisions.drop(columns=['_id', '__v'])
workout_completions = workout_completions.drop(columns=['_id', '__v'])

# Assuming the renaming has been done
workout_completions.rename(columns={'userId': 'email'}, inplace=True)

# Merge operations
data = pd.merge(users, workout_completions, on='email', how='left')
print("After merging with workout_completions:", data.columns)
data = pd.merge(data, intensity_decisions, on='email', how='left')
print("After merging with intensity_decisions:", data.columns)
data = pd.merge(data, weight_logs, on='email', how='left')
print("After merging with weight_logs:", data.columns)

# Checking if 'dayCompleted' is available for transformation
if 'dayCompleted' in data.columns:
    data['workout_completion'] = data.groupby('email')['dayCompleted'].transform('count')
    data['workout_completion'] = scaler.fit_transform(data[['workout_completion']].values.reshape(-1, 1))
else:
    print("dayCompleted column is missing after merging. Check merge conditions and data integrity.")


# One-hot encoding for non-ordinal categorical variables
data = pd.get_dummies(data, columns=['gender', 'goal', 'fitnessLevel'], drop_first=True)

# Feature engineering
# You might calculate features like the change in weight, average workout intensity, etc.
data['weight_change'] = data.groupby('email')['weight'].diff().fillna(0)

# Normalizing data

data[['weight_change', 'workout_completion']] = scaler.fit_transform(data[['weight_change', 'workout_completion']])

# Handling the 'increaseIntensity' as the target variable
data['intensity_decision'] = data['increaseIntensity'].apply(lambda x: 1 if x else 0)

# Assuming 'completed' is a boolean field in 'workout_completions' indicating if a workout was completed
# Normalize 'workout_completion'
# Calculating the count of workout completions per user
data['workout_completion'] = data.groupby('email')['dayCompleted'].transform('count')
data['workout_completion'] = scaler.fit_transform(data[['workout_completion']])

# Split data into features and labels
# Drop unused columns and prepare features (X) and labels (y)
X = data.drop(columns=['email', 'intensity_decision','timestamp'])  # Drop non-feature columns
y = data['intensity_decision']

# Exporting the data to a CSV to check the merge and transformations
data.to_csv('merged_data_check.csv', index=False)

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)