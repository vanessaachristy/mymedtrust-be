import { Schema, model } from 'mongoose';
import { Timestamp } from '../types/record';
import { Medication as IMedication } from 'fhir/r4'

export const requiredAttrs = ['resourceType', 'code'];

export const medicationSchema = new Schema<IMedication & Timestamp>({
    resourceType: {
        type: String,
        required: true
    },
    id: {
        type: String,
    },
    identifier: [{
        type: Object
    }],
    code: {
        type: Object,
        required: true
    },
    status: {
        type: String
    },
    contained: [{
        type: Object,
    }],
    manufacturer: {
        type: Object,
    },
    form: {
        type: Object,

    },
    ingredient: [{
        type: Object,

    }],
    batch: {
        type: Object
    },
    timestamp: {
        type: String,
        required: true
    }

})

export const Medication = model<IMedication>("Medication", medicationSchema);