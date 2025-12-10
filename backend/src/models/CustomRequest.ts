import mongoose from 'mongoose';

const customRequestSchema = new mongoose.Schema({
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    pieceType: { type: String, required: true },
    style: { type: String },
    material: { type: String, required: true },
    finish: { type: String },
    details: { type: String },
    optionsJson: { type: String, required: true },
    measurements: { type: String },
    engraving: { type: String },
    stonesOrColors: { type: String },
    description: { type: String },
    imageBase64: { type: String },
    imageFileId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

customRequestSchema.set('toJSON', {
    transform: (_document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});

const CustomRequest = mongoose.model('CustomRequest', customRequestSchema);

export default CustomRequest;
