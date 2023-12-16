import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';

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

  constructor(private userService: UserService, public auth: AuthService, private httpClient: HttpClient) {
    this.phone = '';
    this.age = 0;
    this.gender = '';
  }

  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }

  ngOnInit() {
    this.userService.userProfile$.subscribe(profile => {
      this.userProfile = profile;

      // Fetch additional profile info from MongoDB using the email
    this.fetchProfileData(this.userProfile.email);
    });
  }

  fetchProfileData(email: string) {
    this.httpClient.get(`http://localhost:3000/profile/${email}`).subscribe((data: any) => {
      this.phone = data.phone;
      this.age = data.age;
      this.gender = data.gender;
      // Handle other properties if necessary
    });
  }

  saveProfile() {
    const profileData = {
      email: this.userProfile.email, // Make sure to send the email as an identifier
      phone: this.phone,
      age: this.age,
      gender: this.gender
    };

    this.httpClient.post('http://localhost:3000/profile/update', profileData).subscribe((response) => {
      console.log('Profile updated:', response);
      // Add any additional logic for a successful update
    }, (error) => {
      console.error('Error updating profile:', error);
      // Add error handling logic
    });
}


}

