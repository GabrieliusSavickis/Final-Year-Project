import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { UserService } from './user.service'; // Import UserService
import * as moment from 'moment';

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
  private userEmail: string = '';

  constructor(
    private httpClient: HttpClient,
    private storage: Storage,
    private userService: UserService  // Inject UserService
  ) {
    this.init();
  }

  // Initialize the service
  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    // Subscribe to user profile changes to update email and load initial state
    this.userService.userProfile$.subscribe(user => {
      if (user?.email) {
        this.userEmail = user.email;  // Update email when user profile changes
        this.loadInitialState();
      }
    });
  }

  // Load initial state of the workout service
  async loadInitialState() {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const lastAccessStr = await this._storage?.get(this.userEmail + '_lastAccessDate');
    const lastAccessDate = lastAccessStr ? new Date(lastAccessStr) : new Date(0);
    lastAccessDate.setHours(0, 0, 0, 0);

    if (today > lastAccessDate) {
      const currentDay = await this.getCurrentDayIndex();
      const totalDays = await this.fetchTotalWorkoutDays();
      const newIndex = (currentDay + 1) % totalDays;
      await this.setCurrentDayIndex(newIndex);
      this.fetchWorkoutPlan(this.userEmail);
    } else {
      const index = await this.getCurrentDayIndex();
      this.currentDayIndex.next(index);
      this.fetchWorkoutPlan(this.userEmail);
    }

    await this._storage?.set(this.userEmail + '_lastAccessDate', today.toISOString());
  }

  // This function sets the current day index in the local storage.
  // It takes an index as a parameter and stores it as a string.
  async setCurrentDayIndex(index: number) {
    await this._storage?.set(this.userEmail + '_currentDayIndex', index.toString());
    this.currentDayIndex.next(index);
  }

  // This function retrieves the current day index from the local storage.
  // It returns a Promise that resolves to a number.
  async getCurrentDayIndex(): Promise<number> {
    const index = await this._storage?.get(this.userEmail + '_currentDayIndex');
    return index ? parseInt(index) : 0;
  }

  // This function fetches the total number of workout days for a user.
  // It makes a GET request to a specific endpoint and returns a Promise that resolves to a number.
  async fetchTotalWorkoutDays(): Promise<number> {
    try {
      const response = await this.httpClient.get<WorkoutPlanResponse>(`http://localhost:3000/tabs/profile/${this.userEmail}`).toPromise();
      return response?.workoutPlan?.workouts.length ?? 0;
    } catch (error) {
      console.error('Error fetching total workout days for', this.userEmail, ':', error);
      return 0;
    }
  }

  // This function fetches the workout plan for a user.
  // It makes a GET request to a specific endpoint and updates the workout plan based on the response.
  fetchWorkoutPlan(email: string) {
    this.httpClient.get<WorkoutPlanResponse>(`http://localhost:3000/tabs/profile/${email}`).subscribe({
      next: (response) => {
        const workouts = response?.workoutPlan?.workouts ?? [];
        this.updateWorkoutPlan(workouts);
      },
      error: (error) => {
        console.error('Error fetching workout plan:', error);
        this.todaysWorkout.next(null);
      }
    });
  }

  // This function updates the workout plan.
  // It takes an array of workouts as a parameter and selects the workout for the current day.
  updateWorkoutPlan(workoutPlan: any[]) {
    if (!workoutPlan || workoutPlan.length === 0) {
      console.error('No workouts found in the plan');
      this.todaysWorkout.next(null);
      return;
    }
    this.selectTodaysWorkout(workoutPlan, this.currentDayIndex.value);
  }

  // This function selects the workout for the current day.
  // It takes an array of workouts and an index as parameters and updates the current workout based on the index.
  selectTodaysWorkout(workoutPlan: any[], index: number) {
    if (index < workoutPlan.length) {
      const todaysWorkout = workoutPlan[index];
      this.todaysWorkout.next(todaysWorkout);
    } else {
      this.setCurrentDayIndex(0);
    }
  }

  // This function increments the current day index.
  // It fetches the total number of workout days and sets the current day index to the next day.
  incrementDay() {
    this.fetchTotalWorkoutDays().then(totalDays => {
      let nextDay = (this.currentDayIndex.value + 1) % totalDays;
      this.setCurrentDayIndex(nextDay);
    });
  }

  // This function toggles the completion status of an exercise.
  // It takes an exercise index as a parameter and updates the completion status of the exercise at that index.
  toggleExerciseCompletion(exerciseIndex: number) {
    let workout = this.todaysWorkout.value;
    if (workout && workout.Exercises[exerciseIndex]) {
      const exercise = workout.Exercises[exerciseIndex];
      exercise.isCompleted = !exercise.isCompleted;
      this.todaysWorkout.next(workout);
      this.logExerciseCompletion(exercise, exercise.isCompleted);
      this.checkCompletion(workout);
    }
  }

  // This function logs the completion status of an exercise.
  // It takes an exercise and a boolean indicating the completion status as parameters.
  // It creates a completion data object and logs it.
  logExerciseCompletion(exercise: any, isCompleted: boolean) {
    const completionData = {
      userId: this.userEmail,
      exerciseTitle: exercise.Title,
      isCompleted: isCompleted,
      timestamp: new Date(),
    };

    this.httpClient.post('http://localhost:3000/api/log-exercise-completion', completionData)
      .subscribe({
        next: (response) => console.log('Exercise completion logged:', response),
        error: (error) => console.error('Error logging exercise completion:', error),
      });
  }

  // This function checks if all exercises in a workout are completed.
  // It takes a workout as a parameter and checks the completion status of all exercises in the workout.
  checkCompletion(workout: any) {
    if (workout.Exercises.every((ex: any) => ex.isCompleted)) {
      console.log('Congratulations, you have finished today\'s workout!');
      this.logWorkoutCompletion(workout);
      this.incrementDay();  // Move to the next day
      this.todaysWorkout.next({ ...workout, completed: true });  // Mark as completed
    }
  }

  // This function logs the completion of a workout.
  // It takes a workout as a parameter and creates a workout completion data object.
  // It then makes a POST request to log the workout completion.
  logWorkoutCompletion(workout: any) {
    const workoutCompletionData = {
      userId: this.userEmail,
      dayCompleted: moment().format('YYYY-MM-DD'),
      workoutId: workout._id, // assuming each workout has a unique identifier
    };

    this.httpClient.post('http://localhost:3000/api/log-workout-completion', workoutCompletionData)
      .subscribe({
        next: (response) => console.log('Workout completion logged:', response),
        error: (error) => console.error('Error logging workout completion:', error),
      });
  }
}
