import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Navigation } from './components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
