import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ExerciseCategory, Exercise } from './exercises-data';
import { AuthService, LogoutOptions } from '@auth0/auth0-angular';


@Component({
  selector: 'app-exercises',
  templateUrl: './exercises.page.html',
  styleUrls: ['./exercises.page.scss'],
})
export class ExercisesPage {
  exerciseCategories: ExerciseCategory[] = [
    {
      id: 'chest',
      name: 'Chest',
      expanded: false,
      imageUrl: '../../exercise-images/chest.png',
      exercises: [
        {
          id: 'db-bench-press',
          name: 'Dumbbell Bench Press',
          videoUrl: 'https://example.com/db-bench-press-video',
          instructions: ['Step 1: Lie on a bench...', /* More steps */],
        },
        // Add more exercises for the "Chest" category
      ],
    },
    // Add more categories and exercises
  ];
  constructor(private router: Router, public auth: AuthService) {}
  logout() {
    this.auth.logout({ returnTo: `${window.location.origin}/login` } as LogoutOptions);
  }

  toggleCategory(category: ExerciseCategory) {
    category.expanded = !category.expanded;
  }

  showExerciseDetails(exercise: Exercise) {
    this.router.navigate(['/exercise-details', exercise.id]);
  }
}
