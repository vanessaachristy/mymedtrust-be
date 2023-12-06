import { Schema, model } from 'mongoose';
import { Timestamp } from '../types/record';
import { Condition as ICondition } from 'fhir/r5';

export const requiredAttrs = ['resourceType', 'clinicalStatus', 'verificationStatus', 'category', 'severity', 'code', 'bodySite', 'subject', 'onsetDateTime'];

export const conditionSchema = new Schema<ICondition & Timestamp>({
    resourceType: {
        type: String,
        required: true
    },
    id: {
        type: String,
    },
    clinicalStatus: {
        type: Object,
        required: true
    },
    verificationStatus: {
        type: Object,
        required: true
    },
    category: [
        {
            type: Object,
            required: true
        }
    ],
    severity: {
        type: Object,
        required: true

    },
    code: {
        type: Object,
        required: true
    },
    bodySite: [{
        type: Object,
        required: true
    }],
    subject: {
        type: Object,
        required: true
    },
    encounter: {
        type: Object
    },
    onsetDateTime: {
        type: String,
        required: true
    },
    abatementDateTime: {
        type: String
    },
    recordedDate: {
        type: String
    },
    participant: [
        {
            type: Object
        }
    ],
    stage: [{
        type: Object
    }],
    note: [
        {
            type: Object
        }
    ],
    timestamp: {
        type: String,
        required: true
    }

})

export const Condition = model<ICondition>("Condition", conditionSchema);