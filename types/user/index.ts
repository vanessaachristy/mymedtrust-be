import { Request } from 'express';

export type UserRequest = {
    username?: string;
    password?: string;
    address?: string
} & Request