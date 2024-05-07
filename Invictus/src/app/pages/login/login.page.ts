import { Component, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  adminUsername: string = ''; // Variable to store the admin username input
  adminPassword: string = ''; // Variable to store the admin password input

  constructor(public auth: AuthService, private router: Router) { }

  ngOnInit() {
    // Subscribe to authentication state changes
    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      console.log('Authentication State:', isAuthenticated);
      if (isAuthenticated) {
        // If authenticated, navigate to the home page
        this.router.navigate(['/tabs/home']);
      }
    });
  }

  // Function to handle admin login
  adminLogin() {
    if (this.adminUsername === 'admin' && this.adminPassword === 'admin123') {
      // If admin credentials are valid, navigate to the admin page
      this.router.navigate(['/admin']);
    } else {
      // If admin credentials are invalid, show an alert
      alert('Invalid credentials');
    }
  }
}
