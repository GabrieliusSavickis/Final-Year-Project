export interface Exercise {
    id: string;
    name: string;
    
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
      imageUrl: '../../../assets/icon/chest.jpg', // Add imageUrl property
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
  ];