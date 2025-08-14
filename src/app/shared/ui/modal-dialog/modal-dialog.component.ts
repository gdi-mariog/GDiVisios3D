import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-modal-dialog',
  imports: [],
  templateUrl: './modal-dialog.component.html',
  styleUrl: './modal-dialog.component.scss'
})
export class ModalDialog implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'fullscreen' = 'medium';
  @Input() showCloseButton: boolean = true;
  @Input() closeOnBackdropClick: boolean = true;
  @Input() closeOnEscapeKey: boolean = true;

  @Output() close = new EventEmitter<void>();
  @Output() backdropClick = new EventEmitter<void>();

  ngOnInit() {
    if (this.closeOnEscapeKey) {
      document.addEventListener('keydown', this.handleEscapeKey);
    }
  }

  ngOnDestroy() {
    if (this.closeOnEscapeKey) {
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
  }

  private handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen) {
      this.onClose();
    }
  };

  onClose() {
    this.close.emit();
  }

  onBackdropClick() {
    this.backdropClick.emit();
    if (this.closeOnBackdropClick) {
      this.onClose();
    }
  }

  onModalContentClick(event: Event) {
    event.stopPropagation();
  }
}
