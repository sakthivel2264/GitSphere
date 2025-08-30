
// utils/github.ts
export function extractGitHubUsername(input: string): string | null {
  // Trim whitespace
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return null;
  }

  // GitHub URL patterns to match
  const urlPatterns = [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]{1,39})(?:\/.*)?$/i,
    /^github\.com\/([a-zA-Z0-9-]{1,39})(?:\/.*)?$/i
  ];

  // Try to match URL patterns
  for (const pattern of urlPatterns) {
    const match = trimmedInput.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // If not a URL, validate as direct username
  const usernamePattern = /^[a-zA-Z0-9-]{1,39}$/;
  if (usernamePattern.test(trimmedInput)) {
    // Additional check: username can't start or end with hyphen
    if (trimmedInput.startsWith('-') || trimmedInput.endsWith('-')) {
      return null;
    }
    return trimmedInput;
  }

  return null;
}
