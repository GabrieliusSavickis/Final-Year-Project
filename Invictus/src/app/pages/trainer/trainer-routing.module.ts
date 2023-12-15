import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TrainerPage } from './trainer.page';

const routes: Routes = [
  {
    path: '',
    component: TrainerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TrainerPageRoutingModule {}
