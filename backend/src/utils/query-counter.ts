import { DataSource } from 'typeorm';

/**
 * Utility class to count database queries in tests
 */
export class QueryCounter {
    private executedQueries: string[] = [];
    private querySubscriber = {
        listenTo() {
            return 'all';
        },
        afterQuery: event => {
            this.executedQueries.push(event.query);
        },
    };

    constructor(private dataSource: DataSource) {}

    /**
     * Start tracking queries
     */
    startCounting(): void {
        this.executedQueries = [];
        this.dataSource.manager.connection.subscribers.push(this.querySubscriber);
    }

    /**
     * Stop tracking queries and return the count
     */
    stopQueryCount(): number {
        const index = this.dataSource.manager.connection.subscribers.indexOf(this.querySubscriber);
        if (index > -1) {
            this.dataSource.manager.connection.subscribers.splice(index, 1);
        }
        return this.executedQueries.length;
    }

    /**
     * Get the executed queries
     */
    getExecutedQueries(): string[] {
        return [...this.executedQueries];
    }

    /**
     * Clear the executed queries
     */
    clearQueries(): void {
        this.executedQueries = [];
    }
}
