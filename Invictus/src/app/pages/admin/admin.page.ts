import { Component } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage {
  constructor(public auth: AuthService, private router: Router) { }

  logout() {
    // Simple logout which will redirect to the Auth0 configured default URL
    this.auth.logout();
  }
}
