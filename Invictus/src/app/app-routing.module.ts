import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';


const routes: Routes = [
  // Upon deployment redirect user to the login page
  {
    path: '',
    loadChildren: () => import('./Pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'tabs',
    component: TabsComponent,
    children: [ // This is where the tabs are defined
      {
        path: 'home',
        loadChildren: () => import('./Pages/home/home.module').then( m => m.HomePageModule)
      },
      {
        path: 'exercises',
        loadChildren: () => import('./Pages/exercises/exercises.module').then( m => m.ExercisesPageModule)
      },
      {
        path: 'trainer',
        loadChildren: () => import('./Pages/trainer/trainer.module').then( m => m.TrainerPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./Pages/profile/profile.module').then( m => m.ProfilePageModule)
      },
    ]

  },
  {
    path: 'home',
    loadChildren: () => import('./Pages/home/home.module').then( m => m.HomePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }