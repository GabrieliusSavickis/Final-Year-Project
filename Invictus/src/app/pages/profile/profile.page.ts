import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePageComponent implements OnInit {
  userProfile: any;
  phone: string;
  age: number;
  gender: string;
  workoutPlan: any[] = []; // Adjust based on your actual data structure
  goal: string = ''; // Added this
  level: string = ''; // Added this

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
      } else {
        // Handle case where profile is not available
        console.error('User profile is not available');
      }
    });
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

logout() {
  this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
}

 // Properties for the chart
 public pieChartOptions: ChartOptions = {
  responsive: true,
  // Add any additional options here
};
public pieChartLabels: string[] = ['Carbs', 'Protein', 'Fat'];
public pieChartData: ChartData<'pie', number[], string> = {
  labels: this.pieChartLabels,
  datasets: [{
    data: [45, 25, 30], // Example data, replace with real data
    backgroundColor: ['blue', 'green', 'red'], // Add your colors
    hoverBackgroundColor: ['lightblue', 'lightgreen', 'lightcoral']
  }]
};
public pieChartType: ChartType = 'pie';
public pieChartLegend = false;
}