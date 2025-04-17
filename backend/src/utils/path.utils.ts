import * as path from 'path';

// Helper function to get the backend project root directory
export const getBackendRoot = () => {
    // Go up two levels from the current file to reach the project root
    // current: backend/src/utils/path.utils.ts
    // root: backend/
    return path.resolve(__dirname, '..', '..');
};

// Helper function to get the data directory path
export const getDataPath = () => {
    return path.join(getBackendRoot(), 'data');
};
