import { Injectable } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Create a BehaviorSubject to hold the user profile data
  // BehaviorSubjects are a type of Observable that can hold a value and emit it to subscribers
  private userProfileSubject = new BehaviorSubject<any>(null);
  // Expose the user profile data as an Observable
  userProfile$ = this.userProfileSubject.asObservable();

  // Inject the AuthService in the constructor
  constructor(private auth: AuthService) {
    // Subscribe to the user profile data from the AuthService
    // The pipe method is used to chain functional programming style operations
    this.auth.user$.pipe(
      filter(user => !!user), // Use the filter operator to ignore null values
      tap(user => this.userProfileSubject.next(user)) // Use the tap operator to perform a side effect with the user data
    ).subscribe(); // Subscribe to start listening for updates
  }

  // Define a method to get the user's email
  // If the user profile data is null, return an empty string
  getEmail(): string {
    return this.userProfileSubject.value?.email ?? '';
  }
}
