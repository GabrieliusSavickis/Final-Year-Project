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
def fetch_data_from_mongodb(collection_name):
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
    
    

# Example usage
data = fetch_data_from_mongodb('your_collection_name')

# Assuming 'data' DataFrame has the following structure:
# columns = ['feature1', 'feature2', 'feature3', ..., 'target']