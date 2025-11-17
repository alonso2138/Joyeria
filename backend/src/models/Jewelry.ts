import mongoose from 'mongoose';

const jewelrySchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    category: { type: String, required: true, enum: ['Anillo', 'Collar', 'Pulsera', 'Pendiente', 'Reloj'] },
    imageUrl: { type: String, required: false },
    overlayAssetUrl: { type: String, required: false },
    imageFileId: { type: String, required: false }, // ID del archivo en GridFS
    hashtags: { type: [String], required: true },
    sku: { type: String, required: false, unique: true, sparse: true },
    isFeatured: { type: Boolean, required: true, default: false },
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
