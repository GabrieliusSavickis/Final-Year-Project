import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userProfileSubject = new BehaviorSubject<any>(null);
  userProfile$ = this.userProfileSubject.asObservable();

  constructor(private auth: AuthService) {
    // Subscribe to the user profile data
    this.auth.user$.pipe(
      filter(user => !!user), // Ensure user is not null
      tap(user => this.userProfileSubject.next(user))
    ).subscribe();
  }

  // Other user related methods can be added here
}
