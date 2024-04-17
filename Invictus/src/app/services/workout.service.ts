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
  private todaysWorkout = new BehaviorSubject<any | null>(null);
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
    this.currentDayIndex.next(index ?? 0); // Fallback to 0 if index is null
    this.fetchWorkoutPlan('gabrrielius@gmail.com');  // Ensure to handle no workout case
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
        const workouts = response.workoutPlan ? response.workoutPlan.workouts : [];
        this.updateWorkoutPlan(workouts);
      },
      error: (error) => {
        console.error('Error fetching workout plan:', error);
        this.todaysWorkout.next(null);
      }
    });
  }
  

  updateWorkoutPlan(workoutPlan: any[]) {
    if (!workoutPlan || workoutPlan.length === 0) {
      console.error('No workouts found in the plan');
      this.todaysWorkout.next(null);
      return;
    }
    console.log('Updated workout plan:', workoutPlan);
    this.selectTodaysWorkout(workoutPlan, this.currentDayIndex.value);
  }
  

  selectTodaysWorkout(workoutPlan: any[], index: number) {
    // Ensure we're not trying to access an index that doesn't exist
    if (index < workoutPlan.length) {
      const todaysWorkout = workoutPlan[index];
      this.todaysWorkout.next(todaysWorkout);
    } else {
      // If we are, reset the current day index and try again
      this.setCurrentDayIndex(0);
      this.selectTodaysWorkout(workoutPlan, 0);
    }
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
        this.incrementDay();  // Move to the next day
        this.todaysWorkout.next({ ...workout, completed: true });  // Mark as completed
    }
}
}
