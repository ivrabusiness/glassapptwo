/**
 * HTML Sanitization utility to prevent XSS attacks
 */

/**
 * Sanitize HTML string by removing potentially dangerous elements and attributes
 */
export function sanitizeHTML(html: string): string {
  // Create a temporary DOM element
  const temp = document.createElement('div');
  temp.textContent = html; // This automatically escapes HTML
  
  // For more complex HTML, we would need a proper sanitization library
  // For now, we're just escaping all HTML to prevent XSS
  return temp.innerHTML;
}

/**
 * Sanitize text for safe insertion into HTML
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return escapeHTML(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate and sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string {
  // Remove javascript: and data: URLs
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('data:') ||
      url.toLowerCase().startsWith('vbscript:')) {
    return '#';
  }
  
  return url;
}

/**
 * Create safe HTML content for printing
 */
export function createSafePrintContent(template: string, data: any): string {
  // Sanitize all data before inserting into template
  const sanitizedData = sanitizeObject(data);
  
  // Simple template replacement (for more complex needs, use a proper template engine)
  let safeContent = template;
  
  // Replace placeholders with sanitized data
  for (const [key, value] of Object.entries(sanitizedData)) {
    const placeholder = `{{${key}}}`;
    safeContent = safeContent.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return safeContent;
}

