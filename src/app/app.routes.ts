import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { GalleryComponent } from './pages/gallery/gallery.component';
import { NoteComponent } from './pages/note/note.component';
import { FlowerComponent } from './components/flower/flower.component';
import { WishesComponent } from './pages/wishes/wishes.component';
import { TimelineComponent } from './pages/timeline/timeline.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: { animation: 'HomePage' }
  },
  {
    path: 'flower',
    component: FlowerComponent,
    data: { animation: 'FlowerPage' }
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    data: { animation: 'GalleryPage' }
  },
  {
    path: 'note',
    component: NoteComponent,
    data: { animation: 'NotePage' }
  },
  {
    path: 'wishes',
    component: WishesComponent,
    data: { animation: 'WishesPage' }
  },
  {
    path: 'timeline',
    component: TimelineComponent,
    data: { animation: 'TimelinePage' }
  },
  {
    path: '**',
    redirectTo: ''
  }
];