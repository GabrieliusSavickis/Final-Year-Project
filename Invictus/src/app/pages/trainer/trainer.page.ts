import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';

@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.page.html',
  styleUrls: ['./trainer.page.scss'],
})
export class TrainerPage{
  height: number;
  weight: number;
  age: number;
  gender: string;

  constructor(private httpClient: HttpClient, public auth: AuthService) { 
    this.height = 0;
    this.weight = 0;
    this.age = 0;
    this.gender = '';
  }

  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }

  saveData() {
    // Prepare the data to send to the server
    const data = {
      height: this.height,
      weight: this.weight,
      age: this.age,
      gender: this.gender,
    };

        // Send a POST request to your Express.js server
        this.httpClient.post('http://localhost:3000/tabs/trainer', data).subscribe((response) => {
          console.log('Data saved:', response);
          // You can add more handling or feedback to the user here
        });
      }
}
