// home.page.ts
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  height: number;
  weight: number;

  constructor(private httpClient: HttpClient, public auth: AuthService, private router: Router) {
    this.height = 0;
    this.weight = 0;
  }



  saveData() {
    // Prepare the data to send to the server
    const data = {
      height: this.height,
      weight: this.weight,
    };

    // Send a POST request to your Express.js server
    this.httpClient.post('http://localhost:3000/home', data).subscribe((response) => {
      console.log('Data saved:', response);
      // You can add more handling or feedback to the user here
    });
  }

  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }
}