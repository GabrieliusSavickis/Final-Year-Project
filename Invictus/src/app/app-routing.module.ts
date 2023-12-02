import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { TabsComponent } from './tabs/tabs.component';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsComponent, // Create a new component to hold the ion-tabs
    children: [
      {
        path: 'home',
        loadChildren: () => import('./Pages/home/home.module').then(m => m.HomePageModule)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'exercises',
        loadChildren: () => import('./Pages/exercises/exercises.module').then(m => m.ExercisesPageModule)
      },
      {
        path: 'trainer',
        loadChildren: () => import('./Pages/trainer/trainer.module').then(m => m.TrainerPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./Pages/profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {

    path: 'login',
    loadChildren: () => import('./Pages/login/login.module').then(m => m.LoginPageModule)

  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
