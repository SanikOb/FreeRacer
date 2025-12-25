import { Routes } from '@angular/router';
import { Game } from './game/game';
import { MainMenu } from './main-menu/main-menu';

export const routes: Routes = [
  { path: '', component: MainMenu },
  { path: 'game', component: Game }
];
