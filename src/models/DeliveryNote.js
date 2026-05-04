import mongoose from 'mongoose';
import softDeletePlugin from '../utils/softDelete.plugin.js';

const deliveryNoteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
            required: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        format: {
            type: String,
            enum: ['material', 'hours'],
            required: [true, 'El formato del albarán es obligatorio'],
        },
        material: {
            type: String,
            trim: true,
        },
        hours: {
            type: Number,
            min: 0,
        },
        description: {
            type: String,
            trim: true,
        },
        workdate: {
            type: Date,
            default: Date.now,
        },
        workers: [
            {
                name: { type: String, trim: true },
                hours: { type: Number, min: 0 },
            },
        ],
        signed: {
            type: Boolean,
            default: false,
        },
        signatureUrl: {
            type: String,
            trim: true,
        },
        pdfUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

deliveryNoteSchema.index({ company: 1 });
deliveryNoteSchema.index({ project: 1 });
deliveryNoteSchema.index({ client: 1 });

deliveryNoteSchema.plugin(softDeletePlugin);

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;
