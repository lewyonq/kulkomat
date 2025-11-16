import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddCouponFormComponent } from './add-coupon-form.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

describe('AddCouponFormComponent', () => {
  let component: AddCouponFormComponent;
  let fixture: ComponentFixture<AddCouponFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCouponFormComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(AddCouponFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values when no prefillShortId', () => {
      expect(component.couponForm).toBeDefined();
      expect(component.couponForm.get('short_id')?.value).toBe('');
      expect(component.couponForm.get('type')?.value).toBe('');
      expect(component.couponForm.get('value')?.value).toBe('');
      expect(component.couponForm.get('expires_at')?.value).toBe('');
    });

    it('should initialize form with prefilled short_id when prefillShortId is provided', () => {
      const prefillValue = 'ABC123';
      fixture.componentRef.setInput('prefillShortId', prefillValue);
      component.ngOnInit();

      expect(component.couponForm.get('short_id')?.value).toBe(prefillValue);
    });

    it('should disable short_id field when prefillShortId is provided', () => {
      const prefillValue = 'ABC123';
      fixture.componentRef.setInput('prefillShortId', prefillValue);
      component.ngOnInit();

      expect(component.couponForm.get('short_id')?.disabled).toBe(true);
    });

    it('should enable short_id field when no prefillShortId is provided', () => {
      expect(component.couponForm.get('short_id')?.disabled).toBe(false);
    });

    it('should initialize with all validators configured', () => {
      expect(component.couponForm.get('short_id')?.hasError('required')).toBe(true);
      expect(component.couponForm.get('type')?.hasError('required')).toBe(true);
      expect(component.couponForm.get('value')?.hasError('required')).toBe(true);
      expect(component.couponForm.get('expires_at')?.hasError('required')).toBe(true);
    });
  });

  describe('short_id Validation', () => {
    it('should be invalid when empty', () => {
      const shortIdControl = component.couponForm.get('short_id');
      shortIdControl?.setValue('');

      expect(shortIdControl?.hasError('required')).toBe(true);
      expect(shortIdControl?.valid).toBe(false);
    });

    it('should be valid with exactly 6 alphanumeric characters', () => {
      const shortIdControl = component.couponForm.get('short_id');
      const validIds = ['ABC123', 'abc123', 'AbC123', '123456', 'ABCDEF'];

      validIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.valid).toBe(true);
      });
    });

    it('should be invalid with less than 6 characters', () => {
      const shortIdControl = component.couponForm.get('short_id');
      shortIdControl?.setValue('ABC12');

      expect(shortIdControl?.hasError('pattern')).toBe(true);
      expect(shortIdControl?.valid).toBe(false);
    });

    it('should be invalid with more than 6 characters', () => {
      const shortIdControl = component.couponForm.get('short_id');
      shortIdControl?.setValue('ABC1234');

      expect(shortIdControl?.hasError('pattern')).toBe(true);
      expect(shortIdControl?.valid).toBe(false);
    });

    it('should be invalid with special characters', () => {
      const shortIdControl = component.couponForm.get('short_id');
      const invalidIds = ['ABC-12', 'ABC_12', 'ABC 12', 'ABC@12', 'ABC#12'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('pattern')).toBe(true);
        expect(shortIdControl?.valid).toBe(false);
      });
    });

    it('should be invalid with whitespace', () => {
      const shortIdControl = component.couponForm.get('short_id');
      shortIdControl?.setValue('AB C12');

      expect(shortIdControl?.hasError('pattern')).toBe(true);
      expect(shortIdControl?.valid).toBe(false);
    });
  });

  describe('type Validation', () => {
    it('should be invalid when empty', () => {
      const typeControl = component.couponForm.get('type');
      typeControl?.setValue('');

      expect(typeControl?.hasError('required')).toBe(true);
      expect(typeControl?.valid).toBe(false);
    });

    it('should be valid with "percentage" type', () => {
      const typeControl = component.couponForm.get('type');
      typeControl?.setValue('percentage');

      expect(typeControl?.valid).toBe(true);
    });

    it('should be valid with "amount" type', () => {
      const typeControl = component.couponForm.get('type');
      typeControl?.setValue('amount');

      expect(typeControl?.valid).toBe(true);
    });
  });

  describe('value Validation', () => {
    it('should be invalid when empty', () => {
      const valueControl = component.couponForm.get('value');
      valueControl?.setValue('');

      expect(valueControl?.hasError('required')).toBe(true);
      expect(valueControl?.valid).toBe(false);
    });

    it('should be invalid with value less than 0.01', () => {
      const valueControl = component.couponForm.get('value');
      valueControl?.setValue(0);

      expect(valueControl?.hasError('min')).toBe(true);
      expect(valueControl?.valid).toBe(false);
    });

    it('should be valid with value equal to 0.01', () => {
      const valueControl = component.couponForm.get('value');
      valueControl?.setValue(0.01);

      expect(valueControl?.valid).toBe(true);
    });

    it('should be valid with any positive value for amount type', () => {
      component.couponForm.get('type')?.setValue('amount');
      const valueControl = component.couponForm.get('value');
      const validValues = [0.01, 1, 10, 100, 1000, 9999.99];

      validValues.forEach((value) => {
        valueControl?.setValue(value);
        expect(valueControl?.valid).toBe(true);
      });
    });

    describe('percentage type specific validation', () => {
      beforeEach(() => {
        component.couponForm.get('type')?.setValue('percentage');
      });

      it('should be invalid with percentage value less than 1', () => {
        const valueControl = component.couponForm.get('value');
        valueControl?.setValue(0.5);

        expect(valueControl?.hasError('percentageRange')).toBe(true);
        expect(valueControl?.valid).toBe(false);
      });

      it('should be valid with percentage value equal to 1', () => {
        const valueControl = component.couponForm.get('value');
        valueControl?.setValue(1);

        expect(valueControl?.valid).toBe(true);
      });

      it('should be valid with percentage value between 1 and 100', () => {
        const valueControl = component.couponForm.get('value');
        const validPercentages = [1, 10, 25, 50, 75, 99, 100];

        validPercentages.forEach((percentage) => {
          valueControl?.setValue(percentage);
          expect(valueControl?.valid).toBe(true);
        });
      });

      it('should be valid with percentage value equal to 100', () => {
        const valueControl = component.couponForm.get('value');
        valueControl?.setValue(100);

        expect(valueControl?.valid).toBe(true);
      });

      it('should be invalid with percentage value greater than 100', () => {
        const valueControl = component.couponForm.get('value');
        valueControl?.setValue(101);

        expect(valueControl?.hasError('percentageRange')).toBe(true);
        expect(valueControl?.valid).toBe(false);
      });
    });

    describe('Conditional validation based on type change', () => {
      it('should add percentage range validator when type changes to percentage', () => {
        const valueControl = component.couponForm.get('value');
        valueControl?.setValue(150);

        // Initially with amount type, value of 150 should be valid
        component.couponForm.get('type')?.setValue('amount');
        expect(valueControl?.valid).toBe(true);

        // After changing to percentage, value of 150 should be invalid
        component.couponForm.get('type')?.setValue('percentage');
        expect(valueControl?.hasError('percentageRange')).toBe(true);
        expect(valueControl?.valid).toBe(false);
      });

      it('should remove percentage range validator when type changes to amount', () => {
        const valueControl = component.couponForm.get('value');

        // Set to percentage first
        component.couponForm.get('type')?.setValue('percentage');
        valueControl?.setValue(150);
        expect(valueControl?.hasError('percentageRange')).toBe(true);
        expect(valueControl?.valid).toBe(false);

        // Change to amount - value of 150 should now be valid
        component.couponForm.get('type')?.setValue('amount');
        expect(valueControl?.hasError('percentageRange')).toBeFalsy();
        expect(valueControl?.valid).toBe(true);
      });
    });
  });

  describe('expires_at Validation', () => {
    it('should be invalid when empty', () => {
      const expiresControl = component.couponForm.get('expires_at');
      expiresControl?.setValue('');

      expect(expiresControl?.hasError('required')).toBe(true);
      expect(expiresControl?.valid).toBe(false);
    });

    it('should be invalid with past date', () => {
      const expiresControl = component.couponForm.get('expires_at');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = yesterday.toISOString().split('T')[0];

      expiresControl?.setValue(pastDate);

      expect(expiresControl?.hasError('futureDate')).toBe(true);
      expect(expiresControl?.valid).toBe(false);
    });

    it('should be valid with future date', () => {
      const expiresControl = component.couponForm.get('expires_at');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      expiresControl?.setValue(futureDate);

      expect(expiresControl?.valid).toBe(true);
    });

    it('should be valid with far future date', () => {
      const expiresControl = component.couponForm.get('expires_at');
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const farFutureDate = nextYear.toISOString().split('T')[0];

      expiresControl?.setValue(farFutureDate);

      expect(expiresControl?.valid).toBe(true);
    });
  });

  describe('isFieldInvalid', () => {
    it('should return false when field is valid', () => {
      component.couponForm.get('short_id')?.setValue('ABC123');
      component.couponForm.get('short_id')?.markAsTouched();

      expect(component.isFieldInvalid('short_id')).toBe(false);
    });

    it('should return false when field is invalid but not touched and not submitted', () => {
      component.couponForm.get('short_id')?.setValue('');

      expect(component.isFieldInvalid('short_id')).toBe(false);
    });

    it('should return true when field is invalid and touched', () => {
      component.couponForm.get('short_id')?.setValue('');
      component.couponForm.get('short_id')?.markAsTouched();

      expect(component.isFieldInvalid('short_id')).toBe(true);
    });

    it('should return true when field is invalid and form is submitted', () => {
      component.couponForm.get('short_id')?.setValue('');
      component.onSubmit();

      expect(component.isFieldInvalid('short_id')).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not emit when form is invalid', () => {
      spyOn(component.formSubmit, 'emit');
      component.onSubmit();

      expect(component.formSubmit.emit).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid', () => {
      component.onSubmit();

      expect(component.couponForm.get('short_id')?.touched).toBe(true);
      expect(component.couponForm.get('type')?.touched).toBe(true);
      expect(component.couponForm.get('value')?.touched).toBe(true);
      expect(component.couponForm.get('expires_at')?.touched).toBe(true);
    });

    it('should emit form data when form is valid', () => {
      spyOn(component.formSubmit, 'emit');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'ABC123',
        type: 'percentage',
        value: 10,
        expires_at: futureDate,
      });

      component.onSubmit();

      expect(component.formSubmit.emit).toHaveBeenCalledWith({
        short_id: 'ABC123',
        type: 'percentage',
        value: 10,
        expires_at: futureDate,
      });
    });

    it('should include disabled short_id field in emitted data when prefilled', () => {
      spyOn(component.formSubmit, 'emit');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      // Initialize with prefilled short_id
      fixture.componentRef.setInput('prefillShortId', 'XYZ789');
      component.ngOnInit();

      component.couponForm.patchValue({
        type: 'amount',
        value: 25.5,
        expires_at: futureDate,
      });

      component.onSubmit();

      expect(component.formSubmit.emit).toHaveBeenCalledWith({
        short_id: 'XYZ789',
        type: 'amount',
        value: 25.5,
        expires_at: futureDate,
      });
    });

    it('should use getRawValue to include disabled fields', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      fixture.componentRef.setInput('prefillShortId', 'ABC123');
      component.ngOnInit();

      component.couponForm.patchValue({
        type: 'percentage',
        value: 15,
        expires_at: futureDate,
      });

      spyOn(component.couponForm, 'getRawValue').and.callThrough();
      component.onSubmit();

      expect(component.couponForm.getRawValue).toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    it('should reset all form fields to empty values', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'ABC123',
        type: 'percentage',
        value: 10,
        expires_at: futureDate,
      });

      component.resetForm();

      expect(component.couponForm.get('short_id')?.value).toBe('');
      expect(component.couponForm.get('type')?.value).toBe('');
      expect(component.couponForm.get('value')?.value).toBe('');
      expect(component.couponForm.get('expires_at')?.value).toBe('');
    });

    it('should reset submitted flag to false', () => {
      component.onSubmit();
      expect(component.isFieldInvalid('short_id')).toBe(true);

      component.resetForm();
      component.couponForm.get('short_id')?.setValue('');

      expect(component.isFieldInvalid('short_id')).toBe(false);
    });

    it('should reset form validity state', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'ABC123',
        type: 'percentage',
        value: 10,
        expires_at: futureDate,
      });

      expect(component.couponForm.valid).toBe(true);

      component.resetForm();

      expect(component.couponForm.valid).toBe(false);
    });
  });

  describe('Integration: Complete Form Flow', () => {
    it('should handle complete form submission for percentage coupon', () => {
      spyOn(component.formSubmit, 'emit');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'TEST01',
        type: 'percentage',
        value: 20,
        expires_at: futureDate,
      });

      expect(component.couponForm.valid).toBe(true);
      component.onSubmit();

      expect(component.formSubmit.emit).toHaveBeenCalledOnceWith({
        short_id: 'TEST01',
        type: 'percentage',
        value: 20,
        expires_at: futureDate,
      });
    });

    it('should handle complete form submission for amount coupon', () => {
      spyOn(component.formSubmit, 'emit');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'TEST02',
        type: 'amount',
        value: 50.75,
        expires_at: futureDate,
      });

      expect(component.couponForm.valid).toBe(true);
      component.onSubmit();

      expect(component.formSubmit.emit).toHaveBeenCalledOnceWith({
        short_id: 'TEST02',
        type: 'amount',
        value: 50.75,
        expires_at: futureDate,
      });
    });

    it('should prevent submission with invalid percentage value', () => {
      spyOn(component.formSubmit, 'emit');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      component.couponForm.patchValue({
        short_id: 'TEST03',
        type: 'percentage',
        value: 150,
        expires_at: futureDate,
      });

      expect(component.couponForm.valid).toBe(false);
      component.onSubmit();

      expect(component.formSubmit.emit).not.toHaveBeenCalled();
    });

    it('should allow large amount value but not percentage value', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split('T')[0];

      // Amount type with large value should be valid
      component.couponForm.patchValue({
        short_id: 'TEST04',
        type: 'amount',
        value: 500,
        expires_at: futureDate,
      });

      expect(component.couponForm.valid).toBe(true);

      // Percentage type with same value should be invalid
      component.couponForm.patchValue({
        type: 'percentage',
      });

      expect(component.couponForm.valid).toBe(false);
      expect(component.couponForm.get('value')?.hasError('percentageRange')).toBe(true);
    });
  });

  describe('Loading State Integration', () => {
    it('should reflect loading input state', () => {
      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
    });

    it('should handle loading state changes', () => {
      fixture.componentRef.setInput('isLoading', false);
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);

      fixture.componentRef.setInput('isLoading', true);
      fixture.detectChanges();
      expect(component.isLoading()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal values for amount type', () => {
      component.couponForm.get('type')?.setValue('amount');
      const valueControl = component.couponForm.get('value');
      const decimalValues = [0.01, 0.99, 1.5, 10.25, 99.99];

      decimalValues.forEach((value) => {
        valueControl?.setValue(value);
        expect(valueControl?.valid).toBe(true);
      });
    });

    it('should handle decimal values for percentage type within range', () => {
      component.couponForm.get('type')?.setValue('percentage');
      const valueControl = component.couponForm.get('value');
      const decimalPercentages = [1.5, 10.25, 50.5, 99.99];

      decimalPercentages.forEach((value) => {
        valueControl?.setValue(value);
        expect(valueControl?.valid).toBe(true);
      });
    });

    it('should handle form reset after prefill', () => {
      fixture.componentRef.setInput('prefillShortId', 'PRE123');
      component.ngOnInit();

      expect(component.couponForm.get('short_id')?.value).toBe('PRE123');
      expect(component.couponForm.get('short_id')?.disabled).toBe(true);

      component.resetForm();

      expect(component.couponForm.get('short_id')?.value).toBe('');
    });

    it('should handle switching between percentage and amount multiple times', () => {
      const valueControl = component.couponForm.get('value');
      valueControl?.setValue(150);

      component.couponForm.get('type')?.setValue('amount');
      expect(valueControl?.valid).toBe(true);

      component.couponForm.get('type')?.setValue('percentage');
      expect(valueControl?.valid).toBe(false);

      component.couponForm.get('type')?.setValue('amount');
      expect(valueControl?.valid).toBe(true);

      component.couponForm.get('type')?.setValue('percentage');
      expect(valueControl?.valid).toBe(false);
    });
  });
});
