import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePageComponent implements OnInit {
  userProfile: any;

  constructor(private userService: UserService) { }

  ngOnInit() {
    this.userService.userProfile$.subscribe(profile => {
      this.userProfile = profile;
    });
  }
}
