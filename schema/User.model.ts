import { Schema, model } from 'mongoose';
import { UserType } from '../types/user';


interface IUser {
    name: string;
    email: string;
    password: string;
    address: string;
    userType: UserType;
    patientList?: string[];
    whitelistedDoctor?: string[];
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        minlength: 6,
        required: true,
        unique: true,

    },
    password: {
        type: String,
        minlength: 10,
        required: true,
    },
    address: {
        type: String,
        required: true,
        minlength: 42,
        unique: true,
    },
    userType: {
        type: String,
        required: true
    },
    patientList: {
        type: [String],
    },
    whitelistedDoctor: {
        type: [String]
    }
});

export const User = model<IUser>("User", userSchema)
