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
    {
      id: 'back',
      name: 'Back',
      expanded: false,
      imageUrl: '../../../assets/icon/back.jpg',
      exercises: [
        {
          id: 'pull-up',
          name: 'Pull-Up',
        },
        {
          id: 'deadlift',
          name: 'Deadlift',
        },
        {
          id: 'bent-over-row',
          name: 'Bent Over Row',
        },
      ],
    },
    {
      id: 'legs',
      name: 'Legs',
      expanded: false,
      imageUrl: '../../../assets/icon/legs.jpg',
      exercises: [
        {
          id: 'squat',
          name: 'Squat',
        },
        {
          id: 'leg-press',
          name: 'Leg Press',
        },
        {
          id: 'lunges',
          name: 'Lunges',
        },
      ],
    },
    {
      id: 'triceps',
      name: 'Triceps',
      expanded: false,
      imageUrl: '../../../assets/icon/triceps.jpg',
      exercises: [
        {
          id: 'tricep-dips',
          name: 'Tricep Dips',
        },
        {
          id: 'tricep-extension',
          name: 'Tricep Extension',
        },
        {
          id: 'close-grip-bench-press',
          name: 'Close Grip Bench Press',
        },
      ],
    },
    {
      id: 'core',
      name: 'Core',
      expanded: false,
      imageUrl: '../../../assets/icon/core.jpg',
      exercises: [
        {
          id: 'plank',
          name: 'Plank',
        },
        {
          id: 'crunches',
          name: 'Crunches',
        },
        {
          id: 'leg-raises',
          name: 'Leg Raises',
        },
      ],
    },
    {
      id: 'cardio',
      name: 'Cardio',
      expanded: false,
      imageUrl: '../../../assets/icon/cardio.jpg',
      exercises: [
        {
          id: 'running',
          name: 'Running',
        },
        {
          id: 'jump-rope',
          name: 'Jump Rope',
        },
        {
          id: 'cycling',
          name: 'Cycling',
        },
      ],
    },
    {
      id: 'forearms',
      name: 'Forearms',
      expanded: false,
      imageUrl: '../../../assets/icon/forearms.jpg',
      exercises: [
        {
          id: 'wrist-curl',
          name: 'Wrist Curl',
        },
        {
          id: 'reverse-wrist-curl',
          name: 'Reverse Wrist Curl',
        },
        {
          id: 'hammer-grip-curl',
          name: 'Hammer Grip Curl',
        },
      ],
    },
    {
      id: 'abdominals',
      name: 'Abdominals',
      expanded: false,
      imageUrl: '../../../assets/icon/abdominals.jpg',
      exercises: [
        {
          id: 'crunches',
          name: 'Crunches',
        },
        {
          id: 'leg-raises',
          name: 'Leg Raises',
        },
        {
          id: 'planks',
          name: 'Planks',
        },
      ],
    },
    {
      id: 'abductors',
      name: 'Abductors',
      expanded: false,
      imageUrl: '../../../assets/icon/abductors.jpg',
      exercises: [
        {
          id: 'side-leg-lifts',
          name: 'Side Leg Lifts',
        },
        {
          id: 'hip-abduction-machine',
          name: 'Hip Abduction Machine',
        },
        {
          id: 'fire-hydrants',
          name: 'Fire Hydrants',
        },
      ],
    },
    {
      id: 'calves',
      name: 'Calves',
      expanded: false,
      imageUrl: '../../../assets/icon/calves.jpg',
      exercises: [
        {
          id: 'calf-raises',
          name: 'Calf Raises',
        },
        {
          id: 'seated-calf-raises',
          name: 'Seated Calf Raises',
        },
        {
          id: 'standing-calf-raises',
          name: 'Standing Calf Raises',
        },
      ],
    }
  ];