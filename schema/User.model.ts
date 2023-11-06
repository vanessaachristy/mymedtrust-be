import { Schema, model } from 'mongoose';


interface IUser {
    name: string;
    email: string;
    password: string;
    address: string;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        minlength: 6,
        required: true,
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
});

export const User = model<IUser>("User", userSchema)
