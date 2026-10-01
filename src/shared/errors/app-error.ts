export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'DOMAIN_RULE_VIOLATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_STATUS_TRANSITION'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number,
    public readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Request validation failed', details: unknown[] = []) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') { super('NOT_FOUND', message, 404); }
}
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') { super('CONFLICT', message, 409); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super('FORBIDDEN', message, 403); }
}
export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') { super('UNAUTHENTICATED', message, 401); }
}
export class DomainRuleViolationError extends AppError {
  constructor(message = 'Domain rule violation', details: unknown[] = []) {
    super('DOMAIN_RULE_VIOLATION', message, 422, details);
  }
}
export class InvalidStatusTransitionError extends AppError {
  constructor(message = 'Invalid status transition') { super('INVALID_STATUS_TRANSITION', message, 409); }
}
export class ExternalServiceUnavailableError extends AppError {
  constructor(message = 'External service unavailable') {
    super('EXTERNAL_SERVICE_UNAVAILABLE', message, 503);
  }
}
export class RateLimitedError extends AppError {
  constructor(message = 'Rate limit exceeded') { super('RATE_LIMITED', message, 429); }
}
