import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { UserService } from '../../services/user.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.page.html', // HTML template for the Trainer page
  styleUrls: ['./trainer.page.scss'], // Styling for the Trainer page
})
export class TrainerPage implements OnInit, OnDestroy {
  // Properties to store user data and interaction state
  height: number;
  weight: number;
  age: number;
  gender: string;
  goal: string;
  fitnessLevel: string;
  workoutDays: number;
  userEmail: string;
  reminderSet: boolean = false; // Flag to track if a reminder is set
  suggestionSet: boolean = false; // Flag to track if a suggestion is set
  lastWeightUpdate!: Date; // Date of the last weight update
  private profileSubscription!: Subscription; // Subscription to user profile updates
  lastInteractionDate: Date | null = null; // Track when the user last interacted with the suggestion.

  constructor(
    private httpClient: HttpClient,
    public auth: AuthService,
    private userService: UserService
  ) {
    // Initialize user data properties
    this.height = 0;
    this.weight = 0;
    this.age = 0;
    this.gender = '';
    this.goal = '';
    this.fitnessLevel = '';
    this.workoutDays = 0;
    this.userEmail = '';
  }

  ngOnInit() {
    // Subscribe to user profile updates
    this.userService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.userEmail = profile.email;
        this.fetchTrainerData(this.userEmail); // Fetch trainer data for the user
      }
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe from user profile updates to prevent memory leaks
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  // Fetch trainer data for the given email
  fetchTrainerData(email: string): void {
    this.httpClient.get(`http://localhost:3000/tabs/trainer/${email}`).subscribe({
      next: (data: any) => {
        console.log('Fetched data:', data); // Log fetched data for debugging
        this.updateUserData(data); // Update user data based on fetched data
      },
      error: (error) => console.error('Error fetching trainer data:', error) // Handle errors during data fetch
    });
  }

  // Update user data based on fetched data
  updateUserData(data: any): void {
    // Update user properties with fetched data
    this.height = data.height;
    this.weight = data.weight;
    this.age = data.age;
    this.gender = data.gender;
    this.goal = data.goal;
    this.fitnessLevel = data.fitnessLevel;
    this.workoutDays = data.workoutDays;

    // Check if weight logs are available and update last weight update date
    if (data.weights && data.weights.length > 0) {
      this.lastWeightUpdate = new Date(data.weights[data.weights.length - 1].date);
      console.log('Last weight update set:', this.lastWeightUpdate);
      this.checkRemindersAndSuggestions(); // Check reminders and suggestions based on updated data
    } else {
      console.log('No weight logs available.');
    }
  }

  // Check reminders and suggestions based on the last weight update
  checkRemindersAndSuggestions(): void {
    if (!this.lastWeightUpdate) {
      console.log("No lastWeightUpdate set yet.");
      return;
    }

    // Calculate duration since last weight update
    const currentTime = moment.utc();
    const lastUpdateTime = moment.utc(this.lastWeightUpdate);
    const durationSinceLastUpdate = currentTime.diff(lastUpdateTime);

    // Log timestamps and duration for debugging
    console.log(`Current Time: ${currentTime.toISOString()}`);
    console.log(`Last Update Time: ${lastUpdateTime.toISOString()}`);
    console.log(`Duration Since Last Update: ${durationSinceLastUpdate}`);

    // Define thresholds for reminders and suggestions
    const oneMinute = 60000; // 1 minute in milliseconds
    const twoMinutes = 120000; // 2 minutes in milliseconds

    // Set reminder flag if duration since last update exceeds one minute
    if (durationSinceLastUpdate > oneMinute) {
      this.reminderSet = true;
      console.log("Reminder set to true.");
    } else {
      this.reminderSet = false;
    }

    // Set suggestion flag if duration since last update exceeds two minutes and user has not interacted with suggestion
    if (durationSinceLastUpdate > twoMinutes && (!this.lastInteractionDate || currentTime.diff(moment.utc(this.lastInteractionDate)) > twoMinutes)) {
      this.suggestionSet = true;
      console.log("Suggestion set to true.");
    } else {
      this.suggestionSet = false;
    }
  }

  // Increase workout intensity based on user input
  increaseIntensity() {
    const intensityData = {
      email: this.userEmail,
      increaseIntensity: true
    };
    // Log the decision to increase intensity
    this.httpClient.post('http://localhost:3000/api/log-intensity-decision', intensityData).subscribe({
      next: (response) => console.log('Intensity decision logged:', response),
      error: (error) => console.error('Error logging intensity decision:', error)
    });

    // Adjust intensity on the server and update interaction date
    this.httpClient.post('http://localhost:5000/api/adjust-intensity', intensityData).subscribe({
      next: (response) => {
        console.log('Intensity increased:', response);
        this.lastInteractionDate = new Date(); // Update last interaction date
        this.suggestionSet = false; // Reset suggestion state
      },
      error: (error) => console.error('Error increasing intensity:', error)
    });
  }

  // Keep current workout intensity
  keepIntensity() {
    this.lastInteractionDate = new Date(); // Update last interaction date
    this.suggestionSet = false; // Reset suggestion state
    console.log("User chose to keep the current intensity. No changes will be made.");
  }

  // Save user data changes
  saveData() {
    if (!this.userEmail) {
      console.error('User email not available');
      return;
    }

    // Prepare user data object for saving
    const userData = {
      email: this.userEmail,
      height: this.height,
      weight: this.weight,
      age: this.age,
      gender: this.gender,
      goal: this.goal,
      fitnessLevel: this.fitnessLevel,
      workoutDays: this.workoutDays,
    };

    // Update user general data on the server
    this.httpClient.post('http://localhost:3000/tabs/trainer', userData).subscribe({
      next: (response) => {
        console.log('User data saved:', response);
        this.updateWeightLog(this.weight);  // Call to update weight log after saving user data
      },
      error: (error) => console.error('Error saving user data:', error),
    });
  }

  // Update weight log on the server
  updateWeightLog(weight: number) {
    const weightData = {
      email: this.userEmail,
      weight: weight
    };

    this.httpClient.post('http://localhost:3000/update-weight', weightData).subscribe({
      next: (response) => console.log('Weight log updated:', response),
      error: (error) => console.error('Error updating weight log:', error)
    });
  }

  // Create a workout plan for the user
  createWorkoutPlan() {
    if (!this.userEmail) {
      console.error('User email not available');
      return;
    }

    // Prepare data for creating a workout plan
    const data = {
      email: this.userEmail,
    };

    // Request the server to create a workout plan
    this.httpClient.post('http://localhost:5000/api/workout-plans', data).subscribe({
      next: (response) => {
        console.log('Workout plan created:', response);
        alert('Workout plan created successfully!'); // Notify the user about successful creation of the workout plan
      },
      error: (error) => {
        console.error('Error creating workout plan:', error);
        alert('Failed to create workout plan. Please try again.'); // Notify the user about the failure to create the workout plan
      }
    });
  }

  // Logout the user
  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }
}
