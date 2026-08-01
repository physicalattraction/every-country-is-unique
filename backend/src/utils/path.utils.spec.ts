import * as path from 'path';

import { getBackendRoot, getDataPath } from './path.utils';

describe('path.utils', () => {
    it('should resolve the backend root two levels above utils', () => {
        expect(getBackendRoot()).toBe(path.resolve(__dirname, '..', '..'));
    });

    it('should resolve the data directory under the backend root', () => {
        expect(getDataPath()).toBe(path.join(getBackendRoot(), 'data'));
    });
});
