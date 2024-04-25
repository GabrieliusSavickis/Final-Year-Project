import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { UserService } from '../../services/user.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.page.html',
  styleUrls: ['./trainer.page.scss'],
})
export class TrainerPage implements OnInit, OnDestroy {
  height: number;
  weight: number;
  age: number;
  gender: string;
  goal: string;
  fitnessLevel: string;
  workoutDays: number;
  userEmail: string;
  reminderSet: boolean = false;
  suggestionSet: boolean = false;
  lastWeightUpdate!: Date;
  private profileSubscription!: Subscription;
  lastInteractionDate: Date | null = null; // Track when the user last interacted with the suggestion.

  constructor(private httpClient: HttpClient, public auth: AuthService,
    private userService: UserService) {
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
    this.userService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.userEmail = profile.email;
        this.fetchTrainerData(this.userEmail);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  fetchTrainerData(email: string): void {
    this.httpClient.get(`http://localhost:3000/tabs/trainer/${email}`).subscribe({
      next: (data: any) => {
        console.log('Fetched data:', data); // Check the complete structure here.
        this.updateUserData(data);

      },
      error: (error) => console.error('Error fetching trainer data:', error)
    });
  }

  updateUserData(data: any): void {
    this.height = data.height;
    this.weight = data.weight;
    this.age = data.age;
    this.gender = data.gender;
    this.goal = data.goal;
    this.fitnessLevel = data.fitnessLevel;
    this.workoutDays = data.workoutDays;
    if (data.weights && data.weights.length > 0) {
      this.lastWeightUpdate = new Date(data.weights[data.weights.length - 1].date);
      console.log('Last weight update set:', this.lastWeightUpdate);
      this.checkRemindersAndSuggestions(); // Call this method here to use the updated date.
    } else {
      console.log('No weight logs available.');
    }
  }

  checkRemindersAndSuggestions(): void {
    if (!this.lastWeightUpdate) {
      console.log("No lastWeightUpdate set yet.");
      return;
    }

    const currentTime = moment.utc();
    const lastUpdateTime = moment.utc(this.lastWeightUpdate);
    const durationSinceLastUpdate = currentTime.diff(lastUpdateTime);

    console.log(`Current Time: ${currentTime.toISOString()}`);
    console.log(`Last Update Time: ${lastUpdateTime.toISOString()}`);
    console.log(`Duration Since Last Update: ${durationSinceLastUpdate}`);

    const oneMinute = 60000; // 1 minute in milliseconds
    const twoMinutes = 120000; // 2 minutes in milliseconds

    if (durationSinceLastUpdate > oneMinute) {
      this.reminderSet = true;
      console.log("Reminder set to true.");
    } else {
      this.reminderSet = false;
    }

    if (durationSinceLastUpdate > twoMinutes && (!this.lastInteractionDate || currentTime.diff(moment.utc(this.lastInteractionDate)) > twoMinutes)) {
      this.suggestionSet = true;
      console.log("Suggestion set to true.");
    } else {
      this.suggestionSet = false;
    }
  }


  increaseIntensity() {
    const intensityData = {
      email: this.userEmail,
      increaseIntensity: true
    };
    // Logging the decision
    this.httpClient.post('http://localhost:3000/api/log-intensity-decision', intensityData).subscribe({
      next: (response) => console.log('Intensity decision logged:', response),
      error: (error) => console.error('Error logging intensity decision:', error)
    });

    this.httpClient.post('http://localhost:5000/api/adjust-intensity', intensityData).subscribe({
      next: (response) => {
        console.log('Intensity increased:', response);
        this.lastInteractionDate = new Date(); // Update last interaction date
        this.suggestionSet = false; // Reset suggestion state
      },
      error: (error) => console.error('Error increasing intensity:', error)
    });
  }

  keepIntensity() {
    this.lastInteractionDate = new Date(); // Update last interaction date
    this.suggestionSet = false; // Reset suggestion state
    console.log("User chose to keep the current intensity. No changes will be made.");
  }

  saveData() {
    if (!this.userEmail) {
      console.error('User email not available');
      return;
    }

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

    // Update user general data
    this.httpClient.post('http://localhost:3000/tabs/trainer', userData).subscribe({
      next: (response) => {
        console.log('User data saved:', response);
        this.updateWeightLog(this.weight);  // Call to update weight log
      },
      error: (error) => console.error('Error saving user data:', error),
    });
  }

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

  createWorkoutPlan() {
    if (!this.userEmail) {
      console.error('User email not available');
      return;
    }

    const data = {
      email: this.userEmail,
    };

    this.httpClient.post('http://localhost:5000/api/workout-plans', data).subscribe({
      next: (response) => {
        console.log('Workout plan created:', response);
        alert('Workout plan created successfully!');
      },
      error: (error) => {
        console.error('Error creating workout plan:', error);
        alert('Failed to create workout plan. Please try again.');
      }
    });
  }

  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }

}
