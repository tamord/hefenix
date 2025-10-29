import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'bookmarks', loadComponent: () => import('./bookmarks.component').then(m => m.BookmarksComponent) }
];
