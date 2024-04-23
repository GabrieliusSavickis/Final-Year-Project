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
  weekDays = moment.weekdaysMin(); // This will give you ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  currentWeek = moment().week();
  workoutDays = new Set<string>();
  workoutStartTime: number = 0;
  workoutDuration: number = 0;
  userEmail: string = '';
  isWorkoutStarted = false;
  workoutTimer: any;
  workoutDurationInSeconds = 0;
  displayTime = '00:00:00';

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
    this.authSubscription = this.auth.user$.subscribe(user => {
      if (user && user.email) {
        this.userEmail = user.email;  // Set userEmail when user data is available
      }
    });

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
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleExerciseCompletion(exerciseIndex: number) {
    this.workoutService.toggleExerciseCompletion(exerciseIndex);
  }

  toggleWorkout() {
    this.isWorkoutStarted = !this.isWorkoutStarted;
  
    if (this.isWorkoutStarted) {
      this.workoutStartTime = Date.now(); // Record start time
      this.startTimer();
      this.workoutDays.add(moment().format('ddd')); // Use 'ddd' for unique three-letter day abbreviations
    } else {
      const workoutEndTime = Date.now();
      const durationInSeconds = (workoutEndTime - this.workoutStartTime) / 1000;
      this.stopTimer();
      this.saveWorkoutMetrics(Array.from(this.workoutDays), this.workoutStartTime, workoutEndTime, durationInSeconds);
      this.workoutDays.clear(); // Optionally clear the set after saving
    }
  }

  startTimer() {
    this.workoutTimer = setInterval(() => {
      this.workoutDurationInSeconds++;
      this.updateDisplayTime();
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.workoutTimer);
  }

  saveWorkoutMetrics(
    workoutDays: string[], 
    workoutStartTime: number, 
    workoutEndTime: number, 
    durationInSeconds: number
  ): void {
    const metricsData = {
      userId: this.userEmail,  // Make sure you have defined this previously or fetch from a reliable source
      workoutDays,
      workoutStartTime,
      workoutEndTime,
      durationInSeconds
    };
  
    this.httpClient.post('http://localhost:3000/api/workout-metrics', metricsData).subscribe({
      next: (response) => console.log('Workout metrics saved:', response),
      error: (error) => console.error('Error saving workout metrics:', error)
    });
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