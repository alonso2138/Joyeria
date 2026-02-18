import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Event from '../models/Event';
import GlobalConfig from '../models/GlobalConfig';
import DemoConfig from '../models/DemoConfig';
import connectDB from '../config/db';

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const EVENTS_PATH = path.join(__dirname, '../../data/events.json');
const CONFIG_PATH = path.join(__dirname, '../../data/campaignConfig.json');

const migrate = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for migration...');

        // 1. Migrate Events
        if (fs.existsSync(EVENTS_PATH)) {
            const eventsData = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf-8'));
            if (Array.isArray(eventsData) && eventsData.length > 0) {
                console.log(`Migrating ${eventsData.length} events...`);
                // Insert events, ignoring timestamp mapping issues by using literal values if possible
                // or just let Mongoose handle it. 
                // We'll map them to ensure timestamp is preserved.
                const formattedEvents = eventsData.map(ev => ({
                    email: ev.email,
                    action_type: ev.action_type,
                    timestamp: new Date(ev.timestamp)
                }));

                await Event.insertMany(formattedEvents);
                console.log('Events migrated successfully.');
            } else {
                console.log('No events to migrate or invalid format.');
            }
        } else {
            console.log('events.json not found, skipping events migration.');
        }

        // 2. Migrate Config
        if (fs.existsSync(CONFIG_PATH)) {
            const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            console.log('Migrating configuration...');

            // Global Config
            const { demoConfigs, ...globalConfig } = configData;

            // Upsert global config
            await GlobalConfig.findOneAndUpdate({}, globalConfig, { upsert: true, new: true });
            console.log('Global configuration migrated.');

            // Demo Configs
            if (demoConfigs) {
                const tags = Object.keys(demoConfigs);
                console.log(`Migrating ${tags.length} demo configurations...`);
                for (const tag of tags) {
                    const demo = demoConfigs[tag];
                    await DemoConfig.findOneAndUpdate(
                        { tag },
                        {
                            tag,
                            branding: demo.branding || {},
                            uiLabels: demo.uiLabels || {},
                            aiPrompts: demo.aiPrompts || {}
                        },
                        { upsert: true }
                    );
                }
                console.log('Demo configurations migrated.');
            }
        } else {
            console.log('campaignConfig.json not found, skipping config migration.');
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
