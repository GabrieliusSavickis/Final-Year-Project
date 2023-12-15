export interface Exercise {
    id: string;
    name: string;
    videoUrl: string;
    instructions: string[];
  }
  
  export interface ExerciseCategory {
    id: string;
    name: string;
    expanded: boolean; // Flag to track card expansion
    imageUrl: string; 
    exercises: Exercise[];
  }
  
  export const exerciseCategories: ExerciseCategory[] = [
    {
      id: 'chest',
      name: 'Chest',
      expanded: false, // Start with categories collapsed
      imageUrl: '../../exercise-images/chest.jpg', // Add imageUrl property
      exercises: [
        {
          id: 'db-bench-press',
          name: 'Dumbbell Bench Press',
          videoUrl: 'https://example.com/db-bench-press-video',
          instructions: ['Step 1: Lie on a bench...', /* More steps */],
        },
        {
          id: 'incl-bench-press',
          name: 'Incline Bench Press',
          videoUrl: 'https://example.com/incl-bench-press-video',
          instructions: ['Step 1: Adjust the bench...', /* More steps */],
        },
        {
          id: 'chest-dip',
          name: 'Chest Dip',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
      ],
    },
    {
      id: 'biceps',
      name: 'Biceps',
      expanded: false, // Start with categories collapsed
      imageUrl: '../../exercise-images/chest.jpg', // Add imageUrl property
      exercises: [
        // Define exercises for the "Biceps" category
        {
            id: 'incline-db-curl',
          name: 'Incline Dumbbell Curl',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
        {
            id: 'standing-bb-curl',
          name: 'Standing Barbell Curl',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
        {
            id: 'db-hammer-curl',
          name: 'Dumbbell Hammer Curl',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
      ],
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      expanded: false, // Start with categories collapsed
      imageUrl: '../../exercise-images/chest.jpg', // Add imageUrl property
      exercises: [
        // Define exercises for the "Shoulders" category
        {
            id: 'db-lateral-raise',
          name: 'Dumbbel Lateral Raise',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
        {
            id: 'overhead-press',
          name: 'Overhead Press',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
        {
            id: 'smith-machine-press',
          name: 'Smith Machine Press',
          videoUrl: 'https://example.com/chest-dip-video',
          instructions: ['Step 1: Use parallel bars...', /* More steps */],
        },
      ],
    },
  ];