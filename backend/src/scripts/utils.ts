import * as path from 'path';

/**
 * Gets the path to the project's data directory
 * @returns The absolute path to the data directory
 */
export function getDataPath(): string {
  // Go up two levels from the scripts directory to reach the project root
  // current: backend/src/scripts/utils.ts
  // root: project_root/
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  return path.join(projectRoot, 'data');
} 
