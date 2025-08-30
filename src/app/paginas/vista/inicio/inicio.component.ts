import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BannerCarouselComponent } from '../../../shared/banner-carousel/banner-carousel.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterOutlet, BannerCarouselComponent],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {}
