const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    allowedDomains: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    ownerEmail: { type: String, required: false },
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'basic' },
    usageCount: { type: Number, default: 0 },
    shutterDesign: { type: String, enum: ['default', 'special'], default: 'default' },
}, { timestamps: true });

const Organization = mongoose.model('Organization', organizationSchema);

async function createDemoOrg() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const demoApiKey = 'demo-key';
        const existing = await Organization.findOne({ apiKey: demoApiKey });

        if (existing) {
            console.log('Demo organization already exists');
        } else {
            const newOrg = new Organization({
                name: 'Joyería Demo',
                apiKey: demoApiKey,
                allowedDomains: ['localhost'],
                isActive: true,
                plan: 'premium',
                shutterDesign: 'special'
            });
            await newOrg.save();
            console.log('Demo organization created successfully');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

createDemoOrg();
