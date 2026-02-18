import mongoose from 'mongoose';

const demoConfigSchema = new mongoose.Schema({
    tag: { type: String, required: true, unique: true },
    branding: { type: mongoose.Schema.Types.Mixed, default: {} },
    uiLabels: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiPrompts: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
});

const DemoConfig = mongoose.model('DemoConfig', demoConfigSchema);

export default DemoConfig;
