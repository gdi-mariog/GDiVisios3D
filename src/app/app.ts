import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GdiLogo } from './shared/ui/gdi-logo/gdi-logo.component';
import { ModalDialog } from './shared/ui/modal-dialog/modal-dialog.component';
import { ConfigDemoComponent } from './components/config-demo/config-demo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GdiLogo],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected title = 'GDiVisios3D';
}
