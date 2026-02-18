import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    email: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
    action_type: { type: String, required: true },
}, {
    timestamps: true,
});

eventSchema.set('toJSON', {
    transform: (document: any, returnedObject: any) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
        return returnedObject;
    }
});

const Event = mongoose.model('Event', eventSchema);

export default Event;
