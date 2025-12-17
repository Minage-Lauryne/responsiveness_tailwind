
export function sanitizeFilename(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
  
  let sanitized = name.replace(/[—–]/g, '-');
  
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '_');
  
  sanitized = sanitized.replace(/[\s]+/g, '_');
  sanitized = sanitized.replace(/[-]+/g, '-');
  sanitized = sanitized.replace(/[_]+/g, '_');
  
  sanitized = sanitized.trim().replace(/^[-_]+|[-_]+$/g, '');
  
  return sanitized + extension;
}
