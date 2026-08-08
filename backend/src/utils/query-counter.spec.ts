import { DataSource } from 'typeorm';

import { QueryCounter } from './query-counter';

describe('QueryCounter', () => {
    let dataSource: DataSource;
    let queryCounter: QueryCounter;
    let warnSpy: jest.SpyInstance;

    beforeAll(async () => {
        dataSource = new DataSource({
            type: 'better-sqlite3',
            database: ':memory:',
            dropSchema: true,
            entities: [],
            synchronize: true,
            logging: false,
        });
        await dataSource.initialize();
        queryCounter = new QueryCounter(dataSource);
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        queryCounter.clearQueries();
        dataSource.manager.connection.subscribers.length = 0;
    });

    afterEach(() => {
        warnSpy.mockRestore();
        queryCounter.stopQueryCount();
    });

    it('should count executed queries while tracking', async () => {
        queryCounter.startCounting();
        await dataSource.query('SELECT 1');
        await dataSource.query('SELECT 2');

        expect(queryCounter.verifyQueryCount(2)).toBe(true);
        expect(warnSpy).not.toHaveBeenCalled();
        expect(queryCounter.stopQueryCount()).toBe(2);
    });

    it('should warn and return false when the count does not match', async () => {
        queryCounter.startCounting();
        await dataSource.query('SELECT 1');

        expect(queryCounter.verifyQueryCount(5)).toBe(false);
        expect(warnSpy).toHaveBeenCalledWith('Executed queries:', expect.any(Array));
    });

    it('should clear tracked queries', async () => {
        queryCounter.startCounting();
        await dataSource.query('SELECT 1');
        queryCounter.clearQueries();

        expect(queryCounter.verifyQueryCount(0)).toBe(true);
    });

    it('should safely stop when the subscriber was already removed', () => {
        queryCounter.startCounting();
        dataSource.manager.connection.subscribers.length = 0;

        expect(queryCounter.stopQueryCount()).toBe(0);
    });
});
