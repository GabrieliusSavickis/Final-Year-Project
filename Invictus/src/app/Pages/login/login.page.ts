import { Component, Inject } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage{

  constructor(@Inject(DOCUMENT) public document:Document, public auth: AuthService) {}
  loginWithRedirect() {
    this.auth.loginWithRedirect();
  }
  
}