import { Schema, model } from 'mongoose';
import { Timestamp } from '../types/record';
import { AllergyIntolerance as IAllergy } from 'fhir/r4';

export const requiredAttrs = ['resourceType', 'clinicalStatus', 'verificationStatus', 'category', 'criticality', 'code', 'patient', 'recorder', 'recordedDate'];

export const allergySchema = new Schema<IAllergy & Timestamp>({
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
    clinicalStatus: {
        type: Object,
        required: true
    },
    verificationStatus: {
        type: Object,
        required: true
    },
    type: {
        type: String,
    },
    category: [
        {
            type: Object,
            required: true
        }
    ],
    criticality: {
        type: String,
        required: true

    },
    code: {
        type: Object,
        required: true
    },
    patient: {
        type: Object,
        required: true

    },
    encounter: {
        type: Object
    },
    onsetDateTime: {
        type: String,
    },
    onsetAge: {
        type: String,
    },
    onsetPeriod: {
        type: String,
    },
    onsetString: {
        type: String
    },
    recordedDate: {
        type: String,
        required: true

    },
    recorder: {
        type: Object,
        required: true

    },
    asserter: {
        type: Object
    },
    lastOccurrence: {
        type: String
    },
    note: [{
        type: Object
    }],
    reaction: [{
        type: Object
    }],
    timestamp: {
        type: String,
        required: true
    }

})

export const Allergy = model<IAllergy>("Allergy", allergySchema);