export interface ValidationResult {
  valid: boolean
  message?: string
}

export const validators = {
  required(value: string, fieldName: string): ValidationResult {
    if (!value || value.trim().length === 0) {
      return { valid: false, message: `${fieldName} is required` }
    }
    return { valid: true }
  },

  email(value: string): ValidationResult {
    if (!value) {
      return { valid: false, message: 'Email is required' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Please enter a valid email address' }
    }
    return { valid: true }
  },

  minLength(value: string, min: number, fieldName: string): ValidationResult {
    if (value.length < min) {
      return { valid: false, message: `${fieldName} must be at least ${min} characters` }
    }
    return { valid: true }
  },

  maxLength(value: string, max: number, fieldName: string): ValidationResult {
    if (value.length > max) {
      return { valid: false, message: `${fieldName} must be at most ${max} characters` }
    }
    return { valid: true }
  },

  passwordStrength(value: string): ValidationResult {
    if (!value) {
      return { valid: false, message: 'Password is required' }
    }
    if (value.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' }
    }
    if (!/[A-Z]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' }
    }
    if (!/[a-z]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' }
    }
    if (!/[0-9]/.test(value)) {
      return { valid: false, message: 'Password must contain at least one number' }
    }
    return { valid: true }
  },

  passwordsMatch(password: string, confirmPassword: string): ValidationResult {
    if (password !== confirmPassword) {
      return { valid: false, message: 'Passwords do not match' }
    }
    return { valid: true }
  },

  username(value: string): ValidationResult {
    if (!value) {
      return { valid: false, message: 'Username is required' }
    }
    if (value.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' }
    }
    if (value.length > 20) {
      return { valid: false, message: 'Username must be at most 20 characters' }
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(value)) {
      return { valid: false, message: 'Username can only contain letters, numbers, and underscores' }
    }
    return { valid: true }
  },
}

export function validateField(
  value: string,
  rules: Array<(value: string, ...args: any[]) => ValidationResult>
): ValidationResult {
  for (const rule of rules) {
    const result = rule(value)
    if (!result.valid) {
      return result
    }
  }
  return { valid: true }
}
