import { Component, OnInit } from '@angular/core';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { WorkoutService } from '../../services/workout.service';
import { ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  // Variables to store data and control workout functionality
  weekDays = moment.weekdaysMin(); // Array of abbreviated weekdays
  currentWeek = moment().week(); // Current week number
  workoutDays = new Set<string>(); // Set to store days when workouts are done
  workoutStartTime: number = 0; // Timestamp when workout starts
  workoutDuration: number = 0; // Duration of the workout
  userEmail: string = ''; // Email of the logged-in user
  isWorkoutStarted = false; // Flag to track if workout is started
  workoutTimer: any; // Timer object to track workout duration
  workoutDurationInSeconds = 0; // Workout duration in seconds
  displayTime = '00:00:00'; // Formatted display time for the workout
  lastResetDay: number = moment().dayOfYear(); // Last day when weekly workout was reset
  overallWorkoutTime: number = 0; // Total workout time for the week

  // Observables for workout data
  todaysWorkout$ = this.workoutService.todaysWorkout$;
  currentDayIndex$ = this.workoutService.currentDayIndex$;

  private authSubscription?: Subscription;

  constructor(public auth: AuthService,
    private router: Router,
    private workoutService: WorkoutService,
    private changeDetectorRef: ChangeDetectorRef,
    private httpClient: HttpClient) {
  }

  ngOnInit() {
    // Subscribe to authentication state changes
    this.authSubscription = this.auth.user$.subscribe(user => {
      if (user && user.email) {
        this.userEmail = user.email; // Set userEmail when user data is available
        this.fetchWorkoutDays(); // Fetch workout days on initialization
        this.fetchWeeklyWorkoutTime(); // Fetch overall workout time for the week
      }
    });

    // Subscribe to today's workout data
    this.workoutService.todaysWorkout$.subscribe(workout => {
      if (workout === undefined) {
        console.log('Workout is still loading...');
      } else if (workout === null) {
        console.log('No workout for today or error in fetching workout plan.');
      } else {
        console.log('There is a valid workout for today:', workout);
      }
    }, error => {
      console.error('Error fetching workout plan:', error);
    });

    // Check if a reset is needed every time the component is loaded.
    this.checkAndResetWeeklyWorkout();
  }

  ngOnDestroy(): void {
    // Unsubscribe from authentication state changes
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Function to toggle completion of an exercise
  toggleExerciseCompletion(exerciseIndex: number) {
    this.workoutService.toggleExerciseCompletion(exerciseIndex);
  }

  // Function to toggle the workout
  toggleWorkout() {
    this.isWorkoutStarted = !this.isWorkoutStarted;

    if (this.isWorkoutStarted) {
      // Start the workout
      this.workoutStartTime = Math.floor(Date.now());
      this.startTimer();
      this.workoutDays.add(moment().format('dd')); // Add today's day abbreviation to workoutDays
      console.log(this.workoutDays);
      this.changeDetectorRef.detectChanges();
    } else {
      // End the workout
      const workoutEndTime = Math.floor(Date.now());
      const durationInSeconds = (workoutEndTime - this.workoutStartTime) / 1000;
      this.stopTimer();
      this.saveWorkoutMetrics(Array.from(this.workoutDays), this.workoutStartTime, workoutEndTime, durationInSeconds);
    }
  }

  // Function to start the workout timer
  startTimer() {
    this.workoutTimer = setInterval(() => {
      this.workoutDurationInSeconds++;
      this.updateDisplayTime();
    }, 1000);
  }

  // Function to stop the workout timer
  stopTimer() {
    clearInterval(this.workoutTimer);
  }

  // Function to save workout metrics
  saveWorkoutMetrics(
    workoutDays: string[],
    workoutStartTime: number,
    workoutEndTime: number,
    durationInSeconds: number,
  ): void {
    const metricsData = {
      userId: this.userEmail,
      workoutDays,
      workoutStartTime,
      workoutEndTime,
      durationInSeconds,
    };

    this.httpClient.post('http://localhost:3000/api/workout-metrics', metricsData).subscribe({
      next: (response) => {
        console.log('Workout metrics saved:', response);
      },
      error: (error) => console.error('Error saving workout metrics:', error)
    });
  }

  // Function to update the display time
  updateDisplayTime() {
    // Calculate hours, minutes, and seconds from workout duration in seconds
    const hours = Math.floor(this.workoutDurationInSeconds / 3600);
    const minutes = Math.floor((this.workoutDurationInSeconds % 3600) / 60);
    const seconds = this.workoutDurationInSeconds % 60;

    // Format and set the display time
    this.displayTime = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  // Function to pad a number with leading zeros
  pad(num: number) {
    return num.toString().padStart(2, '0');
  }

  // Function to format time in hours and minutes
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  // Function to check and reset weekly workout data
  checkAndResetWeeklyWorkout() {
    const today = moment();
    const isStartOfWeek = today.day() === 1; // Checks if it's Monday
    const alreadyReset = today.dayOfYear() === this.lastResetDay;

    if (isStartOfWeek && !alreadyReset) {
      // Reset the weekly workout data
      this.resetWeeklyWorkout();
      this.lastResetDay = today.dayOfYear(); // Update the last reset day
    }
  }

  // Function to reset weekly workout data
  resetWeeklyWorkout() {
    this.workoutDays.clear(); // Clear the set of workout days
    this.overallWorkoutTime = 0; // Reset the overall workout time or any other weekly data
    this.changeDetectorRef.detectChanges(); // Trigger change detection to update the view
    // Save or update this information in the backend if needed
  }

  // Function to fetch workout days for the user
  fetchWorkoutDays() {
    // Fetch workout days from the backend
    this.httpClient.get<string[]>(`http://localhost:3000/api/workout-days/${this.userEmail}`)
      .subscribe({
        next: (workoutDays: string[]) => {
          // Assuming the endpoint returns an array of strings representing the days
          // Add fetched workout days to the set
          workoutDays.forEach(day => {
            this.workoutDays.add(day);
          });
          this.changeDetectorRef.detectChanges(); // Update the view
        },
        error: (error) => console.error('Error fetching workout days:', error)
      });
  }

  // Function to fetch overall workout time for the week
  fetchWeeklyWorkoutTime() {
    // Fetch weekly workout time from the backend
    this.httpClient.get<{ weeklyWorkoutTimeInSeconds: number }>(`http://localhost:3000/api/weekly-workout-time/${this.userEmail}`)
      .subscribe({
        next: (data) => {
          // Use the correct property from your backend response here
          this.overallWorkoutTime = data.weeklyWorkoutTimeInSeconds;
          this.changeDetectorRef.detectChanges(); // Update the view if necessary
        },
        error: (error) => console.error('Error fetching weekly workout time:', error)
      });
  }

  // Function to logout the user
  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }
}