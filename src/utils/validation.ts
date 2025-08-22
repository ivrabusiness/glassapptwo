/**
 * Input validation utilities for security
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): boolean {
  // At least 8 characters, contains uppercase, lowercase, number
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return minLength && hasUpper && hasLower && hasNumber;
}

/**
 * Validate device name
 */
export function isValidDeviceName(name: string): boolean {
  // Only alphanumeric characters, spaces, hyphens, underscores
  const nameRegex = /^[a-zA-Z0-9\s\-_]+$/;
  return nameRegex.test(name) && name.length >= 3 && name.length <= 50;
}

/**
 * Validate order number format
 */
export function isValidOrderNumber(orderNumber: string): boolean {
  // Only alphanumeric characters and hyphens
  const orderRegex = /^[a-zA-Z0-9-]+$/;
  return orderRegex.test(orderNumber) && orderNumber.length >= 1 && orderNumber.length <= 20;
}

/**
 * Sanitize string input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    
    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if identifier is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier);

    if (!attempts) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return false;
    }

    // Reset if window has passed
    if (now - attempts.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return false;
    }

    // Check if limit exceeded
    if (attempts.count >= this.maxAttempts) {
      return true;
    }

    // Increment counter
    attempts.count++;
    return false;
  }

  /**
   * Reset attempts for identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, attempts] of this.attempts.entries()) {
      if (now - attempts.firstAttempt > this.windowMs) {
        this.attempts.delete(identifier);
      }
    }
  }
}

/**
 * Global rate limiter for login attempts
 */
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

