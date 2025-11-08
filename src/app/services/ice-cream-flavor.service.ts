import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { FlavorVM } from '../types/view-models';

/**
 * Ice Cream Flavor Service
 *
 * Serwis odpowiedzialny za dostarczanie listy smaków lodów.
 * W obecnej wersji (MVP) zwraca zahardkodowane dane.
 * W przyszłości będzie zintegrowany z API backendu.
 */
@Injectable({
  providedIn: 'root',
})
export class IceCreamFlavorService {
  /**
   * Zwraca listę dostępnych smaków lodów
   *
   * @returns Observable z tablicą smaków lodów
   */
  getFlavors(): Observable<FlavorVM[]> {
    // Zahardkodowana lista smaków dla MVP
    const flavors: FlavorVM[] = [
      {
        id: 1,
        name: 'Czekoladowy',
        isAvailable: true,
      },
      {
        id: 2,
        name: 'Waniliowy',
        isAvailable: true,
      },
      {
        id: 3,
        name: 'Truskawkowy',
        isAvailable: true,
      },
      {
        id: 4,
        name: 'Pistacjowy',
        isAvailable: false,
      },
      {
        id: 5,
        name: 'Karmelowy',
        isAvailable: true,
      },
      {
        id: 6,
        name: 'Orzechowy',
        isAvailable: true,
      },
      {
        id: 7,
        name: 'Mango',
        isAvailable: false,
      },
      {
        id: 8,
        name: 'Kokosowy',
        isAvailable: true,
      },
    ];

    return of(flavors);
  }
}
