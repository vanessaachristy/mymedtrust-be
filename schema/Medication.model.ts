import { Schema, model } from 'mongoose';
import { Timestamp } from '../types/record';
import { Medication as IMedication } from 'fhir/r4'

export const requiredAttrs = ['resourceType', 'code', 'contained', 'form', 'ingredient'];

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
        required: true
    }],
    manufacturer: {
        type: String,
    },
    form: {
        type: Object,
        required: true

    },
    ingredient: [{
        type: Object,
        required: true

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