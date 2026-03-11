import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFormValidation, ValidationRules } from '../useFormValidation';
import React from 'react';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Wrapper component to provide language context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

interface TestFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

describe('useFormValidation', () => {
  it('validates required fields', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      email: { required: true },
      password: { required: true }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    // Test empty value (should fail)
    const errorEmpty = result.current.validate('email', '');
    expect(errorEmpty).toBeTruthy();

    // Test with value (should pass)
    const errorWithValue = result.current.validate('email', 'test@example.com');
    expect(errorWithValue).toBeNull();
  });

  it('validates email format', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      email: { email: true }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    // Invalid email
    const errorInvalid = result.current.validate('email', 'invalid-email');
    expect(errorInvalid).toBeTruthy();

    // Valid email
    const errorValid = result.current.validate('email', 'test@example.com');
    expect(errorValid).toBeNull();
  });

  it('validates minLength', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      password: { minLength: 8 }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    // Too short
    const errorTooShort = result.current.validate('password', 'short');
    expect(errorTooShort).toBeTruthy();

    // Valid length
    const errorValid = result.current.validate('password', 'longenoughpassword');
    expect(errorValid).toBeNull();
  });

  it('validates custom patterns', () => {
    const phonePattern = /^\d{10,11}$/;
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      phone: { pattern: phonePattern }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    // Invalid pattern
    const errorInvalid = result.current.validate('phone', 'abc123');
    expect(errorInvalid).toBeTruthy();

    // Valid pattern
    const errorValid = result.current.validate('phone', '1234567890');
    expect(errorValid).toBeNull();
  });

  it('returns errors for invalid values', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    const formData: TestFormData = {
      email: 'invalid-email',
      password: 'short',
      name: '',
      phone: ''
    };

    const errors = result.current.validateAll(formData);

    expect(errors.email).toBeTruthy();
    expect(errors.password).toBeTruthy();
  });

  it('isValid returns false when errors exist', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      email: { required: true, email: true },
      password: { required: true, minLength: 8 }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    const invalidFormData: TestFormData = {
      email: 'invalid',
      password: 'short',
      name: '',
      phone: ''
    };

    expect(result.current.isValid(invalidFormData)).toBe(false);

    const validFormData: TestFormData = {
      email: 'test@example.com',
      password: 'validpassword',
      name: '',
      phone: ''
    };

    expect(result.current.isValid(validFormData)).toBe(true);
  });

  it('handles custom validation function', () => {
    const customValidator = (value: string) => {
      return value.includes('admin') ? 'Cannot use reserved word' : null;
    };

    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      name: { custom: customValidator }
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    const errorWithReserved = result.current.validate('name', 'admin-user');
    expect(errorWithReserved).toBe('Cannot use reserved word');

    const errorValid = result.current.validate('name', 'regular-user');
    expect(errorValid).toBeNull();
  });

  it('skips other validations if value is empty and not required', () => {
    const rules: Partial<Record<keyof TestFormData, ValidationRules>> = {
      email: { email: true, minLength: 5 } // No required
    };

    const { result } = renderHook(() => useFormValidation<TestFormData>(rules), { wrapper });

    // Empty value should pass even though minLength/email would fail
    const error = result.current.validate('email', '');
    expect(error).toBeNull();
  });
});
