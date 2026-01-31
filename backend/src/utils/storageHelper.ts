import fs from 'fs/promises';
import path from 'path';

// Data path: backend/data/events.json
// Using process.cwd() to point to the backend root directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

export type EventData = {
    email: string;
    timestamp: string;
    action_type: string;
};

/**
 * Utility to manage local JSON storage for events.
 * Handles concurrency by reading, appending, and writing atomically.
 */
export class StorageHelper {
    private static lockPromise: Promise<void> = Promise.resolve();

    /**
     * Updates the local JSON file with a new event.
     * Uses a simple promise-based lock to queue concurrent writes.
     */
    static async updateEvents(email: string, actionType: string): Promise<void> {
        // Queue the operation to avoid concurrent write issues
        this.lockPromise = this.lockPromise.then(async () => {
            try {
                await this.ensureDir();

                let events: EventData[] = [];
                try {
                    const content = await fs.readFile(DATA_FILE, 'utf-8');
                    events = JSON.parse(content);
                    if (!Array.isArray(events)) {
                        events = [];
                    }
                } catch (error) {
                    // File might not exist yet, that's fine
                    events = [];
                }

                const newEvent: EventData = {
                    email,
                    timestamp: new Date().toISOString(),
                    action_type: actionType
                };

                events.push(newEvent);

                // Write the entire array back to the file
                await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error during local storage update:', error);
            }
        });

        return this.lockPromise;
    }

    /**
     * Reads all events from the local JSON file.
     */
    static async getEvents(): Promise<EventData[]> {
        try {
            const content = await fs.readFile(DATA_FILE, 'utf-8');
            const data = JSON.parse(content);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Deletes events matching the provided criteria.
     */
    static async deleteEvents(eventsToDelete: EventData[]): Promise<void> {
        this.lockPromise = this.lockPromise.then(async () => {
            try {
                const currentEvents = await this.getEvents();
                const toDeleteKeys = new Set(eventsToDelete.map(ev =>
                    `${ev.email}||${ev.action_type}||${ev.timestamp}`
                ));

                const filteredEvents = currentEvents.filter(ev => {
                    const key = `${ev.email}||${ev.action_type}||${ev.timestamp}`;
                    return !toDeleteKeys.has(key);
                });

                await fs.writeFile(DATA_FILE, JSON.stringify(filteredEvents, null, 2), 'utf-8');
            } catch (error) {
                console.error('Error during local storage deletion:', error);
            }
        });

        return this.lockPromise;
    }

    private static async ensureDir(): Promise<void> {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
        } catch (error) {
            // Directory exists or other error
        }
    }
}
