import { Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.page.html',
  styleUrls: ['./trainer.page.scss'],
})
export class TrainerPage implements OnInit{
  height: number;
  weight: number;
  age: number;
  gender: string;
  goal : string;
  fitnessLevel : string;
  workoutDays : number;
  userEmail: string;

  

  constructor(private httpClient: HttpClient, public auth: AuthService, private userService: UserService) { 
    this.height = 0;
    this.weight = 0;
    this.age = 0;
    this.gender = '';
    this.goal = '';
    this.fitnessLevel = '';
    this.workoutDays = 0;
    this.userEmail = '';
  }

  
 

  fetchTrainerData(email: string) {
    this.httpClient.get(`http://localhost:3000/tabs/trainer/${email}`).subscribe((data: any) => {
      console.log('Fetched data:', data); // Debug to see raw data
      if (data) {
        // Update form fields with fetched data
        this.height = data.height;
        this.weight = data.weight;
        this.age = data.age;
        this.gender = data.gender;
        this.goal = data.goal;
        this.fitnessLevel = data.fitnessLevel;
        this.workoutDays = data.workoutDays;
      }
    }, error => {
      console.error('Error fetching trainer data:', error);
    });
  }

  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
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

  ngOnInit() {
    this.userService.userProfile$.subscribe(profile => {
      if (profile && profile.email) {
        this.userEmail = profile.email; // Store the user email
        this.fetchTrainerData(this.userEmail); // Fetch trainer data with email
      }
    });
  }
}
