import { Component, OnInit } from '@angular/core';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { WorkoutService } from '../../services/workout.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  currentWeek = moment().week();
  workoutDays = new Set();
  workoutStartTime: number = 0;
  workoutDuration: number = 0;

  isWorkoutStarted = false;
  workoutTimer: any;
  workoutDurationInSeconds = 0;
  displayTime = '00:00:00';

  todaysWorkout$ = this.workoutService.todaysWorkout$;
  currentDayIndex$ = this.workoutService.currentDayIndex$;

  constructor(public auth: AuthService, 
    private router: Router, 
    private workoutService: WorkoutService,
    private changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.workoutService.todaysWorkout$.subscribe(
      (workout) => {
        if (workout === undefined) {
          // The workout is still loading...
          console.log('Workout is still loading...');
          // Appropriate UI feedback can be managed here or in the template with `*ngIf`
        } else if (workout === null) {
          // There is no workout for today or there was an error fetching the workout plan
          console.log('No workout for today or error in fetching workout plan.');
          // Show an error or empty state in the UI
        } else {
          // There is a valid workout for today
          console.log('There is a valid workout for today:', workout);
          // The workout data will be displayed by the `async` pipe in the template
        }
      },
      (error) => {
        // If there is an error in fetching the workout, log it here
        console.error('Error fetching workout plan:', error);
        // Update the UI to show an error message to the user if needed
      }
    );
  }

  toggleExerciseCompletion(exerciseIndex: number) {
    this.workoutService.toggleExerciseCompletion(exerciseIndex);
  }

  toggleWorkout() {
    this.isWorkoutStarted = !this.isWorkoutStarted;

    if (this.isWorkoutStarted) {
      this.startTimer();
      // Add the current day to workoutDays when the workout starts
      this.workoutDays.add(moment().format('dddd').charAt(0)); // e.g., 'M' for Monday
    } else {
      this.stopTimer();
    }
  }

  startTimer() {
    this.workoutDurationInSeconds = 0;
    this.updateDisplayTime();
    this.workoutTimer = setInterval(() => {
      this.workoutDurationInSeconds++;
      this.updateDisplayTime();
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.workoutTimer);
    // Here you can handle the workout duration as needed
  }

  updateDisplayTime() {
    const hours = Math.floor(this.workoutDurationInSeconds / 3600);
    const minutes = Math.floor((this.workoutDurationInSeconds % 3600) / 60);
    const seconds = this.workoutDurationInSeconds % 60;

    this.displayTime = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  pad(num: number) {
    return num.toString().padStart(2, '0');
  }

  // Placeholder for overall workout time (in seconds)
  overallWorkoutTime = 3600; // 1 hour as an example

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  
  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }
  
}