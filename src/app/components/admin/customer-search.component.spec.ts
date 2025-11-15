import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerSearchComponent } from './customer-search.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

describe('CustomerSearchComponent', () => {
  let component: CustomerSearchComponent;
  let fixture: ComponentFixture<CustomerSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSearchComponent, ReactiveFormsModule],
      providers: [FormBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty shortId value', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('shortId')?.value).toBe('');
    });

    it('should initialize with all validators configured', () => {
      const shortIdControl = component.searchForm.get('shortId');

      expect(shortIdControl?.hasError('required')).toBe(true);
    });

    it('should initialize form in ngOnInit', () => {
      component.searchForm = undefined as any;
      component.ngOnInit();

      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('shortId')).toBeDefined();
    });
  });

  describe('shortId Validation', () => {
    it('should be invalid when empty', () => {
      const shortIdControl = component.searchForm.get('shortId');
      shortIdControl?.setValue('');

      expect(shortIdControl?.hasError('required')).toBe(true);
      expect(shortIdControl?.valid).toBe(false);
    });

    it('should be valid with exactly 6 alphanumeric characters', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const validIds = ['ABC123', 'abc123', 'AbC123', '123456', 'ABCDEF', 'aBcDeF'];

      validIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.valid).withContext(`"${id}" should be valid`).toBe(true);
      });
    });

    it('should be invalid with less than 6 characters', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidIds = ['A', 'AB', 'ABC', 'ABC1', 'ABC12'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('minlength')).withContext(`"${id}" should have minlength error`).toBe(true);
        expect(shortIdControl?.valid).withContext(`"${id}" should be invalid`).toBe(false);
      });
    });

    it('should be invalid with more than 6 characters', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidIds = ['ABC1234', 'ABCD1234', '1234567890'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('maxlength')).withContext(`"${id}" should have maxlength error`).toBe(true);
        expect(shortIdControl?.valid).withContext(`"${id}" should be invalid`).toBe(false);
      });
    });

    it('should be invalid with special characters', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidIds = ['ABC-12', 'ABC_12', 'ABC 12', 'ABC@12', 'ABC#12', 'ABC!12', 'ABC$12'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('pattern')).withContext(`"${id}" should have pattern error`).toBe(true);
        expect(shortIdControl?.valid).withContext(`"${id}" should be invalid`).toBe(false);
      });
    });

    it('should be invalid with whitespace', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidIds = ['AB C12', ' ABC12', 'ABC12 ', '  AB12'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('pattern')).withContext(`"${id}" should have pattern error`).toBe(true);
        expect(shortIdControl?.valid).withContext(`"${id}" should be invalid`).toBe(false);
      });
    });

    it('should be invalid with unicode or accented characters', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidIds = ['ABCĄŚĆ', 'ABC12ę', 'ABĆ123', 'ABC€12'];

      invalidIds.forEach((id) => {
        shortIdControl?.setValue(id);
        expect(shortIdControl?.hasError('pattern')).withContext(`"${id}" should have pattern error`).toBe(true);
        expect(shortIdControl?.valid).withContext(`"${id}" should be invalid`).toBe(false);
      });
    });
  });

  describe('onSubmit', () => {
    it('should not emit when form is invalid', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should not emit when shortId is too short', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC12');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should not emit when shortId has invalid characters', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC-12');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should not emit when isSearching is true', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      fixture.componentRef.setInput('isSearching', true);
      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should emit uppercase shortId when form is valid', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('abc123');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('ABC123');
    });

    it('should not emit when shortId contains whitespace', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      const invalidInputs = [' ABC123 ', '  abc123  ', ' ABC12 '];

      invalidInputs.forEach(input => {
        searchSpy.calls.reset();
        component.searchForm.get('shortId')?.setValue(input);
        component.onSubmit();
        expect(searchSpy).withContext(`"${input}" should not emit`).not.toHaveBeenCalled();
      });
    });

    it('should emit when form is valid and not searching', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      fixture.componentRef.setInput('isSearching', false);
      component.searchForm.get('shortId')?.setValue('TEST01');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledOnceWith('TEST01');
    });

    it('should emit only once per submit', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledTimes(2);
      expect(searchSpy).toHaveBeenCalledWith('ABC123');
    });
  });

  describe('isSearching Input Signal', () => {
    it('should default to false when not provided', () => {
      expect(component.isSearching()).toBe(false);
    });

    it('should reflect the input value when set to true', () => {
      fixture.componentRef.setInput('isSearching', true);
      fixture.detectChanges();

      expect(component.isSearching()).toBe(true);
    });

    it('should reflect the input value when set to false', () => {
      fixture.componentRef.setInput('isSearching', false);
      fixture.detectChanges();

      expect(component.isSearching()).toBe(false);
    });

    it('should prevent submission when isSearching is true', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      fixture.componentRef.setInput('isSearching', true);
      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should allow submission when isSearching changes from true to false', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      fixture.componentRef.setInput('isSearching', true);
      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();
      expect(searchSpy).not.toHaveBeenCalled();

      fixture.componentRef.setInput('isSearching', false);
      component.onSubmit();
      expect(searchSpy).toHaveBeenCalledWith('ABC123');
    });
  });

  describe('Integration: Complete Search Flow', () => {
    it('should handle complete search flow with valid input', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('XYZ789');
      expect(component.searchForm.valid).toBe(true);

      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledOnceWith('XYZ789');
    });

    it('should handle complete search flow with lowercase input', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('xyz789');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('XYZ789');
    });

    it('should handle complete search flow with mixed case input', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('XyZ789');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('XYZ789');
    });

    it('should prevent search when input is invalid and mark as touched', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC12');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle numeric-only shortId', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('123456');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('123456');
    });

    it('should handle letter-only shortId', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABCDEF');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('ABCDEF');
    });

    it('should handle shortId with mixed case letters and numbers', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('a1B2c3');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledWith('A1B2C3');
    });

    it('should not emit when shortId is null', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue(null);
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should not emit when shortId is undefined', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue(undefined);
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple rapid submissions when valid', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledTimes(3);
      expect(searchSpy).toHaveBeenCalledWith('ABC123');
    });

    it('should handle empty string with spaces as invalid', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('      ');
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });

    it('should handle form reset and re-submission', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();
      expect(searchSpy).toHaveBeenCalledWith('ABC123');

      component.searchForm.reset();
      component.searchForm.get('shortId')?.setValue('XYZ789');
      component.onSubmit();

      expect(searchSpy).toHaveBeenCalledTimes(2);
      expect(searchSpy).toHaveBeenCalledWith('XYZ789');
    });
  });

  describe('Business Rules Validation', () => {
    it('should enforce exactly 6 characters rule', () => {
      const shortIdControl = component.searchForm.get('shortId');

      // Test boundary conditions
      shortIdControl?.setValue('ABC12'); // 5 chars
      expect(shortIdControl?.valid).toBe(false);

      shortIdControl?.setValue('ABC123'); // 6 chars
      expect(shortIdControl?.valid).toBe(true);

      shortIdControl?.setValue('ABC1234'); // 7 chars
      expect(shortIdControl?.valid).toBe(false);
    });

    it('should enforce alphanumeric-only rule', () => {
      const shortIdControl = component.searchForm.get('shortId');

      // Valid alphanumeric
      const validCodes = ['ABC123', 'XYZ999', '123ABC', 'aaa111'];
      validCodes.forEach(code => {
        shortIdControl?.setValue(code);
        expect(shortIdControl?.valid).withContext(`${code} should be valid`).toBe(true);
      });

      // Invalid with special chars
      const invalidCodes = ['ABC-23', 'ABC_23', 'ABC.23', 'ABC+23'];
      invalidCodes.forEach(code => {
        shortIdControl?.setValue(code);
        expect(shortIdControl?.valid).withContext(`${code} should be invalid`).toBe(false);
      });
    });

    it('should transform input to uppercase before search', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      const testCases = [
        { input: 'abcdef', expected: 'ABCDEF' },
        { input: 'ABCDEF', expected: 'ABCDEF' },
        { input: 'AbCdEf', expected: 'ABCDEF' },
        { input: '123abc', expected: '123ABC' },
      ];

      testCases.forEach(({ input, expected }) => {
        searchSpy.calls.reset();
        component.searchForm.get('shortId')?.setValue(input);
        component.onSubmit();
        expect(searchSpy).toHaveBeenCalledWith(expected);
      });
    });

    it('should reject input with whitespace as invalid', () => {
      const shortIdControl = component.searchForm.get('shortId');
      const invalidInputs = [
        ' ABC123',
        'ABC123 ',
        ' ABC123 ',
        '  ABC123  ',
        '\tABC123\t',
      ];

      invalidInputs.forEach(input => {
        shortIdControl?.setValue(input);
        expect(shortIdControl?.valid).withContext(`"${input}" should be invalid`).toBe(false);
        expect(shortIdControl?.hasError('pattern')).withContext(`"${input}" should have pattern error`).toBe(true);
      });
    });

    it('should prevent search during active search operation', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      fixture.componentRef.setInput('isSearching', true);
      component.searchForm.get('shortId')?.setValue('ABC123');

      // Try to submit multiple times while searching
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(searchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state across multiple operations', () => {
      const searchSpy = jasmine.createSpy('search');
      component.search.subscribe(searchSpy);

      // First search
      component.searchForm.get('shortId')?.setValue('ABC123');
      component.onSubmit();
      expect(searchSpy).toHaveBeenCalledWith('ABC123');

      // Value should still be in form
      expect(component.searchForm.get('shortId')?.value).toBe('ABC123');

      // Can modify and search again
      component.searchForm.get('shortId')?.setValue('XYZ789');
      component.onSubmit();
      expect(searchSpy).toHaveBeenCalledWith('XYZ789');
    });

    it('should handle touched and untouched states correctly', () => {
      const shortIdControl = component.searchForm.get('shortId');

      expect(shortIdControl?.touched).toBe(false);

      shortIdControl?.markAsTouched();
      expect(shortIdControl?.touched).toBe(true);

      component.searchForm.reset();
      expect(shortIdControl?.touched).toBe(false);
    });

    it('should maintain validation state correctly', () => {
      const shortIdControl = component.searchForm.get('shortId');

      expect(shortIdControl?.valid).toBe(false);
      expect(shortIdControl?.invalid).toBe(true);

      shortIdControl?.setValue('ABC123');
      expect(shortIdControl?.valid).toBe(true);
      expect(shortIdControl?.invalid).toBe(false);

      shortIdControl?.setValue('AB');
      expect(shortIdControl?.valid).toBe(false);
      expect(shortIdControl?.invalid).toBe(true);
    });
  });
});
