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
      imageUrl: '../../../assets/icon/chest.jpg',
      exercises: [
        {
          id: 'db-bench-press',
          name: 'Dumbbell Bench Press',
      
        },
        {
          id: 'incl-bench-press',
          name: 'Incline Bench Press',
        },
        {
          id: 'chest-dip',
          name: 'Chest Dip',
        },
        // Add more exercises for the "Chest" category
      ],
      
    },
    {
      id: 'biceps',
      name: 'Biceps',
      expanded: false, // Start with categories collapsed
      imageUrl: '../../../assets/icon/biceps.jpg', // Add imageUrl property
      exercises: [
        // Define exercises for the "Biceps" category
        {
            id: 'incline-db-curl',
          name: 'Incline Dumbbell Curl',
        },
        {
            id: 'standing-bb-curl',
          name: 'Standing Barbell Curl',
        },
        {
            id: 'db-hammer-curl',
          name: 'Dumbbell Hammer Curl',
        },
      ],
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      expanded: false, // Start with categories collapsed
      imageUrl: '../../../assets/icon/shoulders.jpg', // Add imageUrl property
      exercises: [
        // Define exercises for the "Shoulders" category
        {
            id: 'db-lateral-raise',
          name: 'Dumbbel Lateral Raise',
        },
        {
            id: 'overhead-press',
          name: 'Overhead Press',
        },
        {
            id: 'smith-machine-press',
          name: 'Smith Machine Press',
        },
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
