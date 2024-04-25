import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, ChartData, ChartOptions } from 'chart.js';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePageComponent implements OnInit, OnDestroy, AfterViewInit  {
  userProfile: any;
  
  phone: string;
  age: number;
  gender: string;
  workoutPlan: any[] = []; // Adjust based on your actual data structure
  goal: string = ''; // Added this
  level: string = ''; // Added this

  nutritionData: any;
  @ViewChild('nutritionCanvas') nutritionCanvas!: ElementRef<HTMLCanvasElement>;
  private nutritionChart: any;

  

  constructor(private userService: UserService, public auth: AuthService, private httpClient: HttpClient) {
    this.phone = '';
    this.age = 0;
    this.gender = '';
  }

  ngOnInit() {
    this.userService.userProfile$.subscribe(profile => {
      console.log('Profile received:', profile);
      if (profile) {
        this.userProfile = profile;
        // Fetch additional profile info from MongoDB using the email
        this.fetchProfileData(this.userProfile.email);
        this.fetchNutritionData();
      } else {
        // Handle case where profile is not available
        console.error('User profile is not available');
      }
    });
  }

  ngOnDestroy() {
    if (this.nutritionChart) {
      this.nutritionChart.destroy();
    }
  }

  ngAfterViewInit() {
    this.fetchNutritionData();
  }

  fetchProfileData(email: string) {
    this.httpClient.get(`http://localhost:3000/tabs/profile/${email}`).subscribe({
      next: (data: any) => {
        console.log('Received data:', data);
        this.phone = data.phone;
        this.age = data.age;
        this.gender = data.gender;
        if (data.workoutPlan) {
          this.workoutPlan = data.workoutPlan.workouts; // Assuming the structure based on your MongoDB document
          this.goal = data.workoutPlan.goal; // Assign goal
          this.level = data.workoutPlan.level; // Assign level
        }
      },
      error: (error) => {
        console.error('Error fetching profile data:', error);
      }
    });
  }

  fetchNutritionData() {
    this.httpClient.get<{ Calories: number, Protein: number, Fats: number }>(`http://localhost:3000/api/nutrition-plans/gabrrielius@gmail.com`).subscribe(data => {
      this.createNutritionChart(data);
    }, error => {
      console.error('Failed to fetch nutrition data:', error);
    });
  }

  saveProfile() {
    const profileData = {
      email: this.userProfile.email, // Make sure to send the email as an identifier
      phone: this.phone,
      age: this.age,
      gender: this.gender
    };

    this.httpClient.post('http://localhost:3000/tabs/profile/update', profileData).subscribe((response) => {
      console.log('Profile updated:', response);
      // Add any additional logic for a successful update
    }, (error) => {
      console.error('Error updating profile:', error);
      // Add error handling logic
    });
}

createNutritionChart(data: { Calories: number, Protein: number, Fats: number }) {
  if (this.nutritionChart) {
    this.nutritionChart.destroy(); // Destroy existing chart instance if exists
  }

  const context = this.nutritionCanvas.nativeElement.getContext('2d');
  if (!context) {
    console.error('Unable to get canvas context');
    return;
  }

  const chartData: ChartData<'pie', number[], string> = {
    labels: ['Calories', 'Protein (grams)', 'Fats (grams)'],
    datasets: [{
      data: [data.Calories, data.Protein, data.Fats],
      backgroundColor: [
        'rgba(255, 0, 0, 0.8)',  // solid red
        'rgba(0, 255, 0, 0.8)',  // solid green
        'rgba(0, 0, 255, 0.8)'   // solid blue
      ],
      borderColor: [
        'rgba(255, 0, 0, 1)',  // solid red border
        'rgba(0, 255, 0, 1)',  // solid green border
        'rgba(0, 0, 255, 1)'   // solid blue border
      ],
      borderWidth: 1
    }]
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      }
    },
    layout: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    }
  };

  const config: ChartConfiguration<'pie', number[], string> = {
    type: 'pie',
    data: chartData,
    options: chartOptions
  };

  requestAnimationFrame(() => {
    this.nutritionChart = new Chart(context, config);
  });
}




logout() {
  this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
}

}