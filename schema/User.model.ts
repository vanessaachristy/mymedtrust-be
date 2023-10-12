import { Schema, model } from 'mongoose';


interface IUser {
    username: string;
    password: string;
    address: string;
}

const userSchema = new Schema<IUser>({
    username: {
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
