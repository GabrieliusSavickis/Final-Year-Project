import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

interface WorkoutPlanResponse {
  workoutPlan?: {
    workouts: Array<{
      Day: number;
      Exercises: Array<{
        Title: string;
        Equipment: string;
        BodyParts: string[];
      }>;
    }>;
  };
}

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
    const today = new Date().setHours(0, 0, 0, 0); // Today's date at midnight
    const lastAccessDate = new Date(await this._storage?.get('lastAccessDate') ?? new Date()).setHours(0, 0, 0, 0);

    if (today > lastAccessDate) {
      const currentDay = await this.getCurrentDayIndex();
      const totalDays = await this.fetchTotalWorkoutDays();
      const newIndex = (currentDay + 1) % totalDays; // Ensure the index wraps around correctly
      await this.setCurrentDayIndex(newIndex);
    } else {
      const index = await this.getCurrentDayIndex();
      this.currentDayIndex.next(index);
    }

    await this._storage?.set('lastAccessDate', today.toString()); // Update last access date
    this.fetchWorkoutPlan('gabrrielius@gmail.com'); // Load workout plan
  }

  async setCurrentDayIndex(index: number) {
    await this._storage?.set('currentDayIndex', index);
    this.currentDayIndex.next(index);
  }

  async getCurrentDayIndex(): Promise<number> {
    const index = await this._storage?.get('currentDayIndex');
    return index !== null ? parseInt(index) : 0;  // Ensure a number is returned
  }

  async fetchTotalWorkoutDays(): Promise<number> {
    const email = 'gabrrielius@gmail.com';  // This should ideally be dynamic based on logged-in user
    try {
        // Use the optional chaining operator to safely access properties
        const response = await this.httpClient.get<WorkoutPlanResponse>(`http://localhost:3000/tabs/profile/${email}`).toPromise();
        return response?.workoutPlan?.workouts.length ?? 0;  // Provide 0 as a fallback if any property is undefined
    } catch (error) {
        console.error('Error fetching total workout days:', error);
        return 0;  // Fallback to 0 in case of an error
    }
}


fetchWorkoutPlan(email: string) {
  this.httpClient.get<WorkoutPlanResponse>(`http://localhost:3000/tabs/profile/${email}`).subscribe({
      next: (response) => {
          // Safely access the workouts array using optional chaining and provide an empty array as a fallback
          const workouts = response?.workoutPlan?.workouts ?? [];
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
    this.selectTodaysWorkout(workoutPlan, this.currentDayIndex.value);
  }

  selectTodaysWorkout(workoutPlan: any[], index: number) {
    if (index < workoutPlan.length) {
      const todaysWorkout = workoutPlan[index];
      this.todaysWorkout.next(todaysWorkout);
    } else {
      this.setCurrentDayIndex(0);
      this.selectTodaysWorkout(workoutPlan, 0);
    }
  }

  incrementDay() {
    this.fetchTotalWorkoutDays().then(totalDays => {
      let nextDay = (this.currentDayIndex.value + 1) % totalDays;
      this.setCurrentDayIndex(nextDay);
    });
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
