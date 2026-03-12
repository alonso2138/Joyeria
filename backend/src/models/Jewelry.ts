import mongoose from 'mongoose';

const jewelrySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    category: { type: String, required: true, enum: ['Anillo', 'Collar', 'Gargantilla', 'Pulsera', 'Pendiente', 'Reloj', 'Bolso', 'Camiseta', 'Camisa'] },
    imageUrl: { type: String, required: false },
    overlayAssetUrl: { type: String, required: false },
    imageFileId: { type: String, required: false }, // ID del archivo en GridFS
    hashtags: { type: [String], required: true },
    sku: { type: String, required: false, unique: true, sparse: true },
    isFeatured: { type: Boolean, required: true, default: false },
    catalogId: { type: String, required: true, default: 'main' },
    aiModel: {
        type: String,
        enum: ['gemini-2.5-flash-image', 'gemini-2.0-flash-exp', 'gemini-2.5-pro-preview-06-05', 'gemini-2.0-flash', 'imagen-3.0-generate-002', 'gemini-3.0-flash-image'],
        default: 'gemini-2.5-flash-image'
    },
    options: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
}, {
    timestamps: true,
});

// Use a toJSON transform to format the output object
// 1. Replaces _id with id
// 2. Removes __v
jewelrySchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});

const Jewelry = mongoose.model('Jewelry', jewelrySchema);

export default Jewelry;
