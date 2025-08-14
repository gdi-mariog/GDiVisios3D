import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-gdi-logo',
  imports: [],
  templateUrl: './gdi-logo.component.html',
  styleUrl: './gdi-logo.component.scss'
})
export class GdiLogo {
  @Input() width: string = '120px';
  @Input() height: string = 'auto';
  @Input() showText: boolean = true;
}
