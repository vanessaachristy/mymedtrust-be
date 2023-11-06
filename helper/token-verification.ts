import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserRequest } from '../types/user';


const verifyToken = (req: UserRequest, res: Response, next: NextFunction) => {
    try {
        const cookies = req.cookies;
        const authorization = cookies['Authorization']
        if (!authorization) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Authorization header not exist.",
            })
        }
        if (authorization.split(" ")[0] !== 'Bearer') {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Invalid authorization format."
            })
        }
        const token = authorization.split(" ")[1];
        if (!token) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Token does not exist."
            })
        }
        const verified = jwt.verify(token, dotenv.config().parsed?.JWT_SECRET);
        if (!verified) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "JWT token is not verified."
            })
        }

        const { email, address } = jwt.decode(token) as JwtPayload;
        req.email = email;
        req.address = address;
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: err.message
        })
    }
    next();
}

export default verifyToken;