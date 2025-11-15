import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Values', () => {
    it('should have default isOpen value of false', () => {
      expect(component.isOpen()).toBe(false);
    });

    it('should have default title', () => {
      expect(component.title()).toBe('Potwierdzenie');
    });

    it('should have default message', () => {
      expect(component.message()).toBe('Czy na pewno chcesz kontynuować?');
    });

    it('should have default confirmLabel', () => {
      expect(component.confirmLabel()).toBe('Tak');
    });

    it('should have default cancelLabel', () => {
      expect(component.cancelLabel()).toBe('Nie');
    });

    it('should have default empty confirmButtonClass', () => {
      expect(component.confirmButtonClass()).toBe('');
    });
  });

  describe('Dialog Visibility', () => {
    it('should not render dialog when isOpen is false', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const dialogOverlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(dialogOverlay).toBeNull();
    });

    it('should render dialog when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialogOverlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(dialogOverlay).not.toBeNull();
    });

    it('should show dialog container when open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialogContainer = fixture.debugElement.query(By.css('.dialog-container'));
      expect(dialogContainer).not.toBeNull();
    });

    it('should hide dialog when isOpen changes from true to false', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).not.toBeNull();

      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).toBeNull();
    });
  });

  describe('Custom Input Values', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
    });

    it('should display custom title', () => {
      const customTitle = 'Usuń element';
      fixture.componentRef.setInput('title', customTitle);
      fixture.detectChanges();

      const titleElement = fixture.debugElement.query(By.css('.dialog-title'));
      expect(titleElement.nativeElement.textContent).toBe(customTitle);
    });

    it('should display custom message', () => {
      const customMessage = 'Czy na pewno chcesz usunąć ten element?';
      fixture.componentRef.setInput('message', customMessage);
      fixture.detectChanges();

      const messageElement = fixture.debugElement.query(By.css('.dialog-message'));
      expect(messageElement.nativeElement.textContent).toBe(customMessage);
    });

    it('should display custom confirm label', () => {
      const customLabel = 'Potwierdź';
      fixture.componentRef.setInput('confirmLabel', customLabel);
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      expect(confirmButton.nativeElement.textContent.trim()).toBe(customLabel);
    });

    it('should display custom cancel label', () => {
      const customLabel = 'Anuluj';
      fixture.componentRef.setInput('cancelLabel', customLabel);
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      expect(cancelButton.nativeElement.textContent.trim()).toBe(customLabel);
    });

    it('should apply custom confirmButtonClass', () => {
      const customClass = 'danger-button';
      fixture.componentRef.setInput('confirmButtonClass', customClass);
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      expect(confirmButton.nativeElement.classList.contains(customClass)).toBe(true);
    });

    it('should handle multiple custom classes in confirmButtonClass', () => {
      const customClasses = 'danger-button large-button';
      fixture.componentRef.setInput('confirmButtonClass', customClasses);
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      expect(confirmButton.nativeElement.className).toContain('danger-button');
      expect(confirmButton.nativeElement.className).toContain('large-button');
    });
  });

  describe('Confirm Button Interaction', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should emit confirm event when confirm button is clicked', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      component.confirm.subscribe(confirmSpy);

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm method when confirm button is clicked', () => {
      spyOn(component as any, 'onConfirm').and.callThrough();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();

      expect((component as any).onConfirm).toHaveBeenCalled();
    });

    it('should emit confirm event', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      component.confirm.subscribe(confirmSpy);

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();

      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should handle multiple clicks on confirm button', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      component.confirm.subscribe(confirmSpy);

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();
      confirmButton.nativeElement.click();
      confirmButton.nativeElement.click();

      expect(confirmSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Cancel Button Interaction', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should emit cancel event when cancel button is clicked', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel method when cancel button is clicked', () => {
      spyOn(component as any, 'onCancel').and.callThrough();

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();

      expect((component as any).onCancel).toHaveBeenCalled();
    });

    it('should emit cancel event', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should handle multiple clicks on cancel button', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();
      cancelButton.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Backdrop Click Interaction', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should emit cancel event when backdrop is clicked', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      overlay.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onBackdropClick method when overlay is clicked', () => {
      spyOn(component as any, 'onBackdropClick').and.callThrough();

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      overlay.nativeElement.click();

      expect((component as any).onBackdropClick).toHaveBeenCalled();
    });

    it('should not emit cancel when dialog container is clicked', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const container = fixture.debugElement.query(By.css('.dialog-container'));
      container.nativeElement.click();

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should prevent cancel event when dialog container is clicked directly', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const container = fixture.debugElement.query(By.css('.dialog-container'));

      // Trigger click directly on container - this should not trigger cancel
      // because the template has (click)="$event.stopPropagation()" on container
      const clickEvent = new Event('click', { bubbles: true });
      container.nativeElement.dispatchEvent(clickEvent);

      // Give Angular time to process the event
      fixture.detectChanges();

      // Cancel should not be called because propagation was stopped
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should emit cancel event when ESC key is pressed on overlay', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      overlay.nativeElement.dispatchEvent(escapeEvent);

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when ESC key is pressed', () => {
      spyOn(component as any, 'onCancel').and.callThrough();

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      overlay.nativeElement.dispatchEvent(escapeEvent);

      expect((component as any).onCancel).toHaveBeenCalled();
    });

    it('should not react to other keys', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      overlay.nativeElement.dispatchEvent(enterEvent);

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      overlay.nativeElement.dispatchEvent(spaceEvent);

      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Attributes', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should have role="dialog" on overlay', () => {
      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(overlay.nativeElement.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on overlay', () => {
      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(overlay.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby pointing to title', () => {
      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(overlay.nativeElement.getAttribute('aria-labelledby')).toBe('dialog-title');
    });

    it('should have aria-describedby pointing to message', () => {
      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(overlay.nativeElement.getAttribute('aria-describedby')).toBe('dialog-message');
    });

    it('should have id="dialog-title" on title element', () => {
      const title = fixture.debugElement.query(By.css('.dialog-title'));
      expect(title.nativeElement.id).toBe('dialog-title');
    });

    it('should have id="dialog-message" on message element', () => {
      const message = fixture.debugElement.query(By.css('.dialog-message'));
      expect(message.nativeElement.id).toBe('dialog-message');
    });

    it('should have aria-label on cancel button', () => {
      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      expect(cancelButton.nativeElement.getAttribute('aria-label')).toBe('Anuluj');
    });

    it('should have aria-label on confirm button', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      expect(confirmButton.nativeElement.getAttribute('aria-label')).toBe('Potwierdź');
    });

    it('should have tabindex="-1" on overlay for keyboard focus', () => {
      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      expect(overlay.nativeElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should have type="button" on both buttons', () => {
      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));

      expect(confirmButton.nativeElement.type).toBe('button');
      expect(cancelButton.nativeElement.type).toBe('button');
    });
  });

  describe('Dialog Structure', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should have dialog header section', () => {
      const header = fixture.debugElement.query(By.css('.dialog-header'));
      expect(header).not.toBeNull();
    });

    it('should have dialog content section', () => {
      const content = fixture.debugElement.query(By.css('.dialog-content'));
      expect(content).not.toBeNull();
    });

    it('should have dialog actions section', () => {
      const actions = fixture.debugElement.query(By.css('.dialog-actions'));
      expect(actions).not.toBeNull();
    });

    it('should render title inside header', () => {
      const header = fixture.debugElement.query(By.css('.dialog-header'));
      const title = header.query(By.css('.dialog-title'));
      expect(title).not.toBeNull();
    });

    it('should render message inside content', () => {
      const content = fixture.debugElement.query(By.css('.dialog-content'));
      const message = content.query(By.css('.dialog-message'));
      expect(message).not.toBeNull();
    });

    it('should render both buttons inside actions', () => {
      const actions = fixture.debugElement.query(By.css('.dialog-actions'));
      const buttons = actions.queryAll(By.css('.dialog-button'));
      expect(buttons.length).toBe(2);
    });

    it('should render cancel button before confirm button in DOM', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.dialog-button'));
      expect(buttons[0].nativeElement.classList.contains('cancel-button')).toBe(true);
      expect(buttons[1].nativeElement.classList.contains('confirm-button')).toBe(true);
    });
  });

  describe('Business Rules Integration', () => {
    it('should handle complete confirmation flow', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      component.confirm.subscribe(confirmSpy);

      // Open dialog
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).not.toBeNull();

      // Click confirm
      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle complete cancellation flow', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      // Open dialog
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      // Click cancel
      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle backdrop click to close', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      overlay.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle ESC key to close', () => {
      const cancelSpy = jasmine.createSpy('cancel');
      component.cancel.subscribe(cancelSpy);

      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const overlay = fixture.debugElement.query(By.css('.dialog-overlay'));
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      overlay.nativeElement.dispatchEvent(escapeEvent);

      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });

    it('should not emit confirm when cancel is clicked', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      const cancelSpy = jasmine.createSpy('cancel');
      component.confirm.subscribe(confirmSpy);
      component.cancel.subscribe(cancelSpy);

      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
      cancelButton.nativeElement.click();

      expect(cancelSpy).toHaveBeenCalled();
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('should not emit cancel when confirm is clicked', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      const cancelSpy = jasmine.createSpy('cancel');
      component.confirm.subscribe(confirmSpy);
      component.cancel.subscribe(cancelSpy);

      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const confirmButton = fixture.debugElement.query(By.css('.confirm-button'));
      confirmButton.nativeElement.click();

      expect(confirmSpy).toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string title', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', '');
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.dialog-title'));
      expect(title.nativeElement.textContent).toBe('');
    });

    it('should handle empty string message', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('message', '');
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.dialog-message'));
      expect(message.nativeElement.textContent).toBe('');
    });

    it('should handle very long title text', () => {
      const longTitle = 'A'.repeat(200);
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', longTitle);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.dialog-title'));
      expect(title.nativeElement.textContent).toBe(longTitle);
    });

    it('should handle very long message text', () => {
      const longMessage = 'B'.repeat(500);
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('message', longMessage);
      fixture.detectChanges();

      const message = fixture.debugElement.query(By.css('.dialog-message'));
      expect(message.nativeElement.textContent).toBe(longMessage);
    });

    it('should handle rapid open/close toggling', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).not.toBeNull();

      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).toBeNull();

      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).not.toBeNull();

      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.dialog-overlay'))).toBeNull();
    });

    it('should handle changing inputs while dialog is open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Initial Title');
      fixture.detectChanges();

      let title = fixture.debugElement.query(By.css('.dialog-title'));
      expect(title.nativeElement.textContent).toBe('Initial Title');

      fixture.componentRef.setInput('title', 'Updated Title');
      fixture.detectChanges();

      title = fixture.debugElement.query(By.css('.dialog-title'));
      expect(title.nativeElement.textContent).toBe('Updated Title');
    });

    it('should handle special characters in text inputs', () => {
      const specialTitle = '<script>alert("test")</script>';
      const specialMessage = '&nbsp;<b>Bold</b>';

      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', specialTitle);
      fixture.componentRef.setInput('message', specialMessage);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.dialog-title'));
      const message = fixture.debugElement.query(By.css('.dialog-message'));

      // Angular should escape these automatically
      expect(title.nativeElement.textContent).toBe(specialTitle);
      expect(message.nativeElement.textContent).toBe(specialMessage);
    });
  });
});
