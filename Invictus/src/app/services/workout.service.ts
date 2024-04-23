import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import { UserService } from './user.service';
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

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.userService.userProfile$.subscribe(user => {
      if (user?.email) {
        this.userEmail = user.email;  // Update email when user profile changes
        this.loadInitialState();
      }
    });
  }

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

  async setCurrentDayIndex(index: number) {
    await this._storage?.set(this.userEmail + '_currentDayIndex', index.toString());
    this.currentDayIndex.next(index);
  }

  async getCurrentDayIndex(): Promise<number> {
    const index = await this._storage?.get(this.userEmail + '_currentDayIndex');
    return index ? parseInt(index) : 0;
  }

  async fetchTotalWorkoutDays(): Promise<number> {
    try {
        const response = await this.httpClient.get<WorkoutPlanResponse>(`http://localhost:3000/tabs/profile/${this.userEmail}`).toPromise();
        return response?.workoutPlan?.workouts.length ?? 0;
    } catch (error) {
        console.error('Error fetching total workout days for', this.userEmail, ':', error);
        return 0;
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
      const exercise = workout.Exercises[exerciseIndex];
      exercise.isCompleted = !exercise.isCompleted;
      this.todaysWorkout.next(workout);
      this.logExerciseCompletion(exercise, exercise.isCompleted);
      this.checkCompletion(workout);
    }
  }

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

  checkCompletion(workout: any) {
    if (workout.Exercises.every((ex: any) => ex.isCompleted)) {
      console.log('Congratulations, you have finished today\'s workout!');
      this.logWorkoutCompletion(workout);
      this.incrementDay();  // Move to the next day
      this.todaysWorkout.next({ ...workout, completed: true });  // Mark as completed
    }
  }

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
