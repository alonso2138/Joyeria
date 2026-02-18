import mongoose from 'mongoose';

const globalConfigSchema = new mongoose.Schema({
    branding: { type: mongoose.Schema.Types.Mixed, default: {} },
    uiLabels: { type: mongoose.Schema.Types.Mixed, default: {} },
    customizationOptions: { type: mongoose.Schema.Types.Mixed, default: {} },
    aiPrompts: { type: mongoose.Schema.Types.Mixed, default: {} },
    tryOnMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    saasPlans: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
    collection: 'global_configs' // Pluralize as per convention or keep it singular
});

// Since we only want one global config, we can add a helper or just rely on IDs
const GlobalConfig = mongoose.model('GlobalConfig', globalConfigSchema);

export default GlobalConfig;
