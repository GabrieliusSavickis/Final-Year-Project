import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage{

  constructor(public auth:AuthService, private router:Router) {}
  ngOnInit() {
    // Subscribe to authentication state changes
    this.auth.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        // If authenticated, navigate to the home page
        this.router.navigate(['/home']);
      }
    });
  }
  
  
}