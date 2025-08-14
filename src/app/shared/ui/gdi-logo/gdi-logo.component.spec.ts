import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GdiLogo } from './gdi-logo.component';

describe('GdiLogo', () => {
  let component: GdiLogo;
  let fixture: ComponentFixture<GdiLogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GdiLogo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GdiLogo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
