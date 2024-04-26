# Invictus Fitness App

The Invictus Fitness App is a comprehensive fitness application designed to help users achieve their fitness goals through personalized workout routines, dietary recommendations, and real-time activity tracking. 
This Ionic-based mobile app is integrated with MongoDB for backend data management and utilizes various APIs and libraries for enhanced functionality.

## Features

- **User Authentication**: Secure login and user management powered by Auth0.
- **Real-time Data**: Exercise, nutrition, and activity data updated in real time.
- **Personalized Fitness Plans**: Custom workout routines and diet plans based on user preferences and goals.
- **Activity Tracking**: Integration of a mock step-counter and workout completion tracking.
- **Interactive UI/UX**: Sleek and responsive design with intuitive navigation.

## Technologies

- **Frontend**: Ionic Framework, Angular
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Other Libraries**: Chart.js for data visualization, Moment.js for date handling

## Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/GabrieliusSavickis/Final-Year-Project.git
   cd final-year-project
   
2. **Install Dependencies**:
   - Navigate to the project directory and install npm packages:
     ```bash
     npm install
     npm install moment chart.js bootstrap moment-timezone
     ```

   - Set up Python environment and install packages:
     ```bash
     pip install pandas pymongo flask_cors
     ```

3. **Database Setup**:
   - MongoDB Cluster Login:
     ```plaintext
     Username: invictus
     Password: invictusfyp
     ```

4. **Running the Application**:
   - Start the server:
     ```bash
     npm start
     ```
   - Launch the app in your preferred mobile simulator or web browser.

## Deployment

- **Preparing the environment**:
  - After cloning the repository, install all necessary dependencies:
    ```bash
    npm install
    npm install moment chart.js bootstrap moment-timezone
    pip install pandas pymongo flask_cors
    ```

- **Running the Server**:
  - To start the backend server, navigate to the server directory and run:
    ```bash
    cd Invictus/server
    node server.js
    ```

- **Running Microservices**:
  - For the workout and nutrition plan generation, navigate to the microservices directory and start the Python scripts:
    ```bash
    cd Invictus/src/app/microservices
    python app.py  # For workout and nutrition plans
    python prediction.py  # For generating predictions
    ```

- **Launching the Ionic App**:
  - To run the Ionic frontend application:
    ```bash
    cd Invictus
    ionic serve
    ```

- Ensure that your environment variables and MongoDB configurations are correctly set up as per the provided instructions in the setup section.

This deployment guide outlines the steps necessary to get the Invictus Fitness App running on your local machine for development and testing purposes. Follow the instructions carefully to ensure a successful setup.


## Acknowledgments

- Special thanks to my supervisor John Healy for his invaluable guidance and support throughout the project.
- Gratitude to all who provided feedback and testing to improve the app.

## Contact

- For any inquiries or further information, you can reach me at `[gabrrielius@gmail.com]`.