import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, filter, take } from 'rxjs';
import { ConfigService } from '../services/config.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigGuard implements CanActivate {

  constructor(
    private configService: ConfigService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.configService.isLoaded$.pipe(
      filter(isLoaded => isLoaded), // Wait until config is loaded
      take(1), // Take only the first emission
      map(() => {
        const config = this.configService.getConfig();
        if (!config) {
          console.error('Configuration not available');
          // Optionally redirect to an error page
          // this.router.navigate(['/error']);
          return false;
        }
        return true;
      })
    );
  }
}
