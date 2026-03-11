import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface ValidationRules {
  required?: boolean;
  email?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export function useFormValidation<T extends Record<string, any>>(
  rules: Partial<Record<keyof T, ValidationRules>>
) {
  const { t } = useLanguage();

  const validate = useCallback(
    (field: keyof T, value: any): string | null => {
      const fieldRules = rules[field];
      if (!fieldRules) return null;

      // Required validation
      if (fieldRules.required) {
        if (value === undefined || value === null || value === '') {
          return t('validation.required');
        }
      }

      // If value is empty and not required, skip other validations
      if (!value) return null;

      // Email validation
      if (fieldRules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return t('validation.invalid_email');
        }
      }

      // Min length validation
      if (fieldRules.minLength !== undefined) {
        if (String(value).length < fieldRules.minLength) {
          return t('validation.min_length').replace('{min}', String(fieldRules.minLength));
        }
      }

      // Max length validation
      if (fieldRules.maxLength !== undefined) {
        if (String(value).length > fieldRules.maxLength) {
          return t('validation.max_length').replace('{max}', String(fieldRules.maxLength));
        }
      }

      // Pattern validation
      if (fieldRules.pattern) {
        if (!fieldRules.pattern.test(String(value))) {
          return t('validation.invalid_format');
        }
      }

      // Custom validation
      if (fieldRules.custom) {
        return fieldRules.custom(value);
      }

      return null;
    },
    [rules, t]
  );

  const validateAll = useCallback(
    (values: T): Record<string, string> => {
      const errors: Record<string, string> = {};

      Object.keys(rules).forEach((field) => {
        const error = validate(field as keyof T, values[field]);
        if (error) {
          errors[field] = error;
        }
      });

      return errors;
    },
    [rules, validate]
  );

  const isValid = useCallback(
    (values: T): boolean => {
      const errors = validateAll(values);
      return Object.keys(errors).length === 0;
    },
    [validateAll]
  );

  return {
    validate,
    validateAll,
    isValid,
  };
}
