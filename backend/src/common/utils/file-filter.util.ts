import * as path from 'path';

/** Directories to always ignore during extraction */
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'coverage',
  'venv', '__pycache__', '.venv', 'env', '.env', '.idea', '.vscode',
  '.DS_Store', 'vendor', 'target', 'bin', 'obj', '.cache',
  '.turbo', '.nuxt', '.output', '.svelte-kit',
]);

/** File extensions to ignore (binary/media/dangerous) */
const IGNORED_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.obj', '.class',
  '.jar', '.war', '.ear', '.pyc', '.pyo', '.whl',
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
  '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.flac',
  '.zip', '.tar', '.gz', '.rar', '.7z', '.bz2',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.lock', '.map',
]);

/** File names to always ignore */
const IGNORED_FILES = new Set([
  '.env', '.env.local', '.env.production', '.env.development',
  '.env.staging', '.env.test',
  '.DS_Store', 'Thumbs.db', 'desktop.ini',
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
]);

/** Supported source code extensions */
const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.cpp', '.c', '.h', '.hpp', '.cs', '.rb', '.php', '.swift',
  '.kt', '.scala', '.lua', '.r', '.m', '.mm',
  '.css', '.scss', '.sass', '.less', '.html', '.htm', '.vue', '.svelte',
  '.json', '.yaml', '.yml', '.toml', '.xml',
  '.md', '.mdx', '.txt', '.rst',
  '.sql', '.graphql', '.gql', '.prisma',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
  '.dockerfile', '.dockerignore', '.gitignore', '.editorconfig',
  '.env.example', '.eslintrc', '.prettierrc',
  '.tf', '.hcl', '.nginx', '.conf',
]);

/** Language detection from extension */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.java': 'java', '.go': 'go', '.rs': 'rust',
  '.cpp': 'cpp', '.c': 'c', '.h': 'c', '.hpp': 'cpp', '.cs': 'csharp',
  '.rb': 'ruby', '.php': 'php', '.swift': 'swift', '.kt': 'kotlin',
  '.scala': 'scala', '.lua': 'lua', '.r': 'r',
  '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
  '.html': 'html', '.htm': 'html', '.vue': 'vue', '.svelte': 'svelte',
  '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml', '.xml': 'xml',
  '.md': 'markdown', '.mdx': 'markdown', '.txt': 'text',
  '.sql': 'sql', '.graphql': 'graphql', '.gql': 'graphql', '.prisma': 'prisma',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'zsh',
  '.dockerfile': 'dockerfile', '.tf': 'terraform',
};

/** Limits */
export const FILE_LIMITS = {
  MAX_ZIP_SIZE: 50 * 1024 * 1024,        // 50MB
  MAX_FILE_SIZE: 1 * 1024 * 1024,         // 1MB per file
  MAX_FILES: 500,                          // max files to extract
  MAX_PATH_LENGTH: 500,                    // max path length
};

/**
 * Check if a path segment should be ignored.
 * Prevents processing of node_modules, .git, etc.
 */
export function shouldIgnorePath(filePath: string): boolean {
  const segments = filePath.split(/[/\\]/);
  return segments.some(segment => IGNORED_DIRS.has(segment));
}

/**
 * Check if a file should be processed based on its name and extension.
 */
export function shouldProcessFile(filePath: string): boolean {
  const basename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  // Ignore specific filenames
  if (IGNORED_FILES.has(basename)) return false;

  // Ignore binary/media extensions
  if (IGNORED_EXTENSIONS.has(ext)) return false;

  // Accept supported source extensions
  if (SUPPORTED_EXTENSIONS.has(ext)) return true;

  // Accept files without extensions that have common names
  if (!ext && ['Makefile', 'Dockerfile', 'Procfile', 'Gemfile', 'Rakefile'].includes(basename)) {
    return true;
  }

  return false;
}

/**
 * Detect language from file extension.
 */
export function detectLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] || null;
}

/**
 * Validate a file path for path traversal attacks.
 * Returns true if the path is safe.
 */
export function isPathSafe(filePath: string): boolean {
  // Reject absolute paths
  if (path.isAbsolute(filePath)) return false;

  // Reject paths with ..
  const normalized = path.normalize(filePath);
  if (normalized.startsWith('..') || normalized.includes('/../') || normalized.includes('\\..\\')) {
    return false;
  }

  // Reject excessively long paths
  if (filePath.length > FILE_LIMITS.MAX_PATH_LENGTH) return false;

  // Reject paths with null bytes
  if (filePath.includes('\0')) return false;

  return true;
}
