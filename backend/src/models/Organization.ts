import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    allowedDomains: { type: [String], default: [] }, // Array of domains, e.g. ["joyeriaprieto.com"]
    isActive: { type: Boolean, default: true },
    ownerEmail: { type: String, required: false },
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'basic' },
    usageCount: { type: Number, default: 0 },
    lastUsageMonth: { type: String, default: () => new Date().toISOString().substring(0, 7) }, // YYYY-MM
    demoTag: { type: String, unique: true, sparse: true }, // Link to a demo configuration
}, {
    timestamps: true,
});

organizationSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
