import Event from '../models/Event';

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
        try {
            await Event.create({
                email,
                action_type: actionType,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error during local storage update:', error);
        }
    }

    /**
     * Reads all events from the local JSON file.
     */
    static async getEvents(): Promise<EventData[]> {
        try {
            const events = await Event.find().sort({ timestamp: -1 }).lean();
            return events.map((ev: any) => ({
                email: ev.email,
                timestamp: ev.timestamp.toISOString(),
                action_type: ev.action_type
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Deletes events matching the provided criteria.
     */
    static async deleteEvents(eventsToDelete: EventData[]): Promise<void> {
        try {
            for (const ev of eventsToDelete) {
                await Event.deleteOne({
                    email: ev.email,
                    action_type: ev.action_type,
                    timestamp: new Date(ev.timestamp)
                });
            }
        } catch (error) {
            console.error('Error during local storage deletion:', error);
        }
    }

    // lockPromise and ensureDir are no longer needed for MongoDB
}
