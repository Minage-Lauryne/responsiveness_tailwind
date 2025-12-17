
export function stripVerificationLog(content: string): string {
  if (!content) return content;
  
  // Use a more robust regex pattern to match the verification log blocks
  const verificationLogRegex = /\[\[\[VERIFICATION_LOG\]\]\][\s\S]*?\[\[\[\/VERIFICATION_LOG\]\]\]/g;
  
  const hasVerificationLog = verificationLogRegex.test(content);
  if (hasVerificationLog) {
    console.log('🔍 Stripping verification log from content');
  }
  
  return content.replace(verificationLogRegex, '').trim();
}