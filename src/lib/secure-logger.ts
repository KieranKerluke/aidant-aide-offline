/**
 * Secure Logging Utility
 * Prevents sensitive information from being logged to the console
 */

import { secureFetch } from './csrf';

// List of sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
  'access_token',
  'refresh_token',
  'id_token',
  'token',
  'password',
  'secret',
  'key',
  'authorization',
  'client_secret',
  'api_key',
  'private_key',
  'session',
  'cookie'
];

/**
 * Redacts sensitive information from objects before logging
 * @param data The data to be sanitized
 * @returns Sanitized data safe for logging
 */
function sanitizeForLogging(data: any): any {
  if (!data) return data;
  
  // Handle primitive types
  if (typeof data !== 'object') return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }
  
  // Handle objects
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    // Check if the key contains any sensitive terms
    const isKeyMatch = SENSITIVE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    );
    
    if (isKeyMatch) {
      // Redact sensitive values
      sanitized[key] = typeof data[key] === 'string' 
        ? '***REDACTED***' 
        : '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Redact sensitive information from logs
function redactSensitiveInfo(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitivePatterns = [
    /token/i,
    /key/i,
    /secret/i,
    /password/i,
    /auth/i,
    /credentials/i
  ];

  const redacted = { ...data };
  
  for (const key in redacted) {
    if (typeof redacted[key] === 'string') {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(key)) {
          redacted[key] = '***REDACTED***';
          break;
        }
      }
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveInfo(redacted[key]);
    }
  }

  return redacted;
}

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  environment: string;
  service: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: LogLevel.INFO,
  environment: import.meta.env.MODE || 'development',
  service: 'aidant-aide'
};

class SecureLogger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.config.level);
    const targetLevelIndex = levels.indexOf(level);
    return targetLevelIndex >= currentLevelIndex;
  }

  private async sendLog(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      environment: this.config.environment,
      service: this.config.service,
      message,
      data: data ? redactSensitiveInfo(data) : undefined
    };

    try {
      await secureFetch('/.netlify/functions/security-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Fallback to console if logging service is unavailable
      console.error('Failed to send log:', error);
    }
  }

  debug(message: string, data?: any) {
    this.sendLog(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.sendLog(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.sendLog(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any) {
    this.sendLog(LogLevel.ERROR, message, data);
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

/**
 * Patch the global console to prevent accidental logging of sensitive data
 * Call this in development environments only
 */
export function enableSecureConsoleInDevelopment(): void {
  if (import.meta.env.DEV) {
    const originalConsole = { ...console };
    
    // Override console methods
    console.log = (message?: any, ...optionalParams: any[]) => {
      originalConsole.log(message, ...optionalParams.map(param => sanitizeForLogging(param)));
    };
    
    console.info = (message?: any, ...optionalParams: any[]) => {
      originalConsole.info(message, ...optionalParams.map(param => sanitizeForLogging(param)));
    };
    
    console.warn = (message?: any, ...optionalParams: any[]) => {
      originalConsole.warn(message, ...optionalParams.map(param => sanitizeForLogging(param)));
    };
    
    console.error = (message?: any, ...optionalParams: any[]) => {
      originalConsole.error(message, ...optionalParams.map(param => sanitizeForLogging(param)));
    };
    
    console.debug = (message?: any, ...optionalParams: any[]) => {
      originalConsole.debug(message, ...optionalParams.map(param => sanitizeForLogging(param)));
    };
    
    // Log that secure console is enabled
    originalConsole.info('🔒 Secure console logging enabled');
  }
}
