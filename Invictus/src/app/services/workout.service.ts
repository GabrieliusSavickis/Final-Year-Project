import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  private currentDayIndex = new BehaviorSubject<number>(0);
  public currentDayIndex$ = this.currentDayIndex.asObservable();
  private todaysWorkout = new BehaviorSubject<any>(null);
  public todaysWorkout$ = this.todaysWorkout.asObservable();
  private _storage: Storage | null = null;

  constructor(private httpClient: HttpClient, private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.loadInitialState();
  }

  async loadInitialState() {
    const index = await this.getCurrentDayIndex();
    if (index !== null) {
      this.currentDayIndex.next(index);
    } else {
      this.setCurrentDayIndex(0);  // Default to start at Day 1
    }
    this.fetchWorkoutPlan('gabrrielius@gmail.com');  // Assuming this fetches and updates the plan
  }

  async setCurrentDayIndex(index: number) {
    await this._storage?.set('currentDayIndex', index);
    this.currentDayIndex.next(index);
  }

  async getCurrentDayIndex(): Promise<number|null> {
    const index = await this._storage?.get('currentDayIndex');
    return index === null ? 0 : index;  // Handle null and undefined cases
  }

  fetchWorkoutPlan(email: string) {
    this.httpClient.get(`http://localhost:3000/tabs/profile/${email}`).subscribe({
      next: (response: any) => {
        console.log('Workout plan fetched successfully:', response);
        const workoutPlan = response.workoutPlan ? response.workoutPlan.workouts : [];
        if (workoutPlan.length === 0) {
          console.error('No workouts found for today');
          this.todaysWorkout.next(null);  // Update to no workout state
        } else {
          this.updateWorkoutPlan(workoutPlan);
        }
      },
      error: (error) => {
        console.error('Error fetching workout plan:', error);
        this.todaysWorkout.error(new Error('Error fetching workout plan'));  // Properly push an error state
      }
    });
  }
  

  updateWorkoutPlan(workoutPlan: any[]) {
    console.log('Updated workout plan:', workoutPlan);
    this.selectTodaysWorkout(workoutPlan, this.currentDayIndex.value);
  }

  selectTodaysWorkout(workoutPlan: any[], index: number) {
    const todayIndex = index % workoutPlan.length;
    this.todaysWorkout.next(workoutPlan[todayIndex]);
  }

  incrementDay() {
    let nextDay = (this.currentDayIndex.value + 1) % this.todaysWorkout.value.length;
    this.setCurrentDayIndex(nextDay);
  }

  toggleExerciseCompletion(exerciseIndex: number) {
    let workout = this.todaysWorkout.value;
    if (workout && workout.Exercises[exerciseIndex]) {
      workout.Exercises[exerciseIndex].isCompleted = !workout.Exercises[exerciseIndex].isCompleted;
      this.todaysWorkout.next(workout);
      this.checkCompletion(workout);
    }
  }

  checkCompletion(workout: any) {
    if (workout.Exercises.every((ex: any) => ex.isCompleted)) {
      console.log('Congratulations, you have finished today\'s workout!');
      this.incrementDay();  // Consider what to do if the plan completes
    }
  }
}
