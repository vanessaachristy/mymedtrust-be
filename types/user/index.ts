import { Request } from 'express';

export type UserRequest = {
    name?: string;
    email?: string;
    password?: string;
    address?: string;
    ic?: string;
    phone?: string;
    birthdate?: string;
    gender?: Gender;
    homeAddress?: string;
    userType?: UserType;
} & Request & PatientRequest & DoctorRequest & AddressRequest;

export type PatientRequest = {
    emergencyContact?: {
        name: string;
        number: string;
    };
    bloodType?: BloodType;
    height?: number;
    weight?: number;
}

export type DoctorRequest = {
    hospital?: string;
    qualification?: string;
    major?: string;
}

export const enum BloodType {
    A = "A",
    B = "B",
    AB = "AB",
    O = "O"
}
export const enum Gender {
    MALE = 'male',
    FEMALE = 'female'
}
export type AddressRequest = {
    account?: string,
    patient?: string,
    doctor?: string
}

export const enum UserType {
    PATIENT = "patient",
    DOCTOR = "doctor",
    ADMIN = "admin",
}