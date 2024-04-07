import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {
  public currentDayIndex = new BehaviorSubject<number>(0);
  currentDayIndex$ = this.currentDayIndex.asObservable();

  public todaysWorkout = new BehaviorSubject<any>(null);
  todaysWorkout$ = this.todaysWorkout.asObservable();

  private _storage: Storage | null = null;

  constructor(private httpClient: HttpClient, private storage: Storage) {
    this.init();
   }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
  }

  async setCurrentDayIndex(index: number) {
    await this._storage?.set('currentDayIndex', index);
  }

  async getCurrentDayIndex() {
    return await this._storage?.get('currentDayIndex');
  }

  fetchWorkoutPlan(email: string) {
    // Mock fetch from server, replace with actual HTTP request
    // Example: this.httpClient.get<YourWorkoutPlanType>(`/api/workoutPlan/${email}`).subscribe(...)
    const mockWorkoutPlan = // Assume this comes from your backend
    [{
      Day: 1,
      Exercises: [
        { Title: 'Bench Press', Sets: 4, Repetitions: 10, isCompleted: false },
        // Add more exercises
      ]
    },
    // More days
    ];
    // For now, we use a mock plan. Replace it with actual fetch logic.
    this.updateWorkoutPlan(mockWorkoutPlan);
  }

  updateWorkoutPlan(workoutPlan: any[]) {
    this.selectTodaysWorkout(workoutPlan, this.currentDayIndex.value);
  }

  selectTodaysWorkout(workoutPlan: any[], index: number) {
    if (workoutPlan && workoutPlan.length > 0) {
      const todayIndex = index % workoutPlan.length;
      this.todaysWorkout.next(workoutPlan[todayIndex]);
    }
  }

  incrementDay() {
    let nextDay = this.currentDayIndex.value + 1;
    this.currentDayIndex.next(nextDay);
    this.setCurrentDayIndex(nextDay); // Update the day index in local storage
  }

  
  
  toggleExerciseCompletion(dayIndex: number, exerciseIndex: number) {
    // Retrieve the current workout plan from the BehaviorSubject
    let currentWorkout = this.todaysWorkout.value;
    
    // Toggle the completion state of the specified exercise
    if (currentWorkout && currentWorkout.Exercises[exerciseIndex]) {
      const exercise = currentWorkout.Exercises[exerciseIndex] as any; // Explicitly specifying type as any
      exercise.isCompleted = !exercise.isCompleted;
      
      // Update the todaysWorkout BehaviorSubject to reflect the change
      this.todaysWorkout.next(currentWorkout);
  
      // Check if all exercises for the day are completed
      let allCompleted = currentWorkout.Exercises.every((exercise: any) => exercise.isCompleted); // Explicitly specifying parameter type
      if (allCompleted) {
        // Handle completion logic here, such as showing a congratulatory message
        console.log('Congratulations, you have finished today\'s workout!');
        this.incrementDay(); // Move to the next day
      }
    }
  }
}
