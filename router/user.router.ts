import express, { Request, Response } from 'express';
import { User } from '../schema/User.model';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRequest } from '../types/user';
import verifyToken from '../helper/token-verification';
import { configDotenv } from 'dotenv';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.get("/", verifyToken, async (req: UserRequest, res: Response) => {
    const user = await User.findOne({
        username: req.username
    });
    return res.status(StatusCodes.OK).json({
        username: user.username,
        address: user.address,
    })
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body as UserRequest;
    if (!username) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Username does not exist in body!"
        })
    }

    if (!password) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Password does not exist in body!"
        })
    }

    try {
        const user = await User.findOne({
            username
        });
        const validation = await bcrypt.compare(password, user.password);
        if (!validation) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "error",
                error: "Credentials are mismatched."
            })
        }
        const token = jwt.sign({
            username: user.username,
            address: user.address
        }, configDotenv()?.parsed?.JWT_SECRET);
        return res.cookie("Authorization", `Bearer ${token}`, { maxAge: 1800000 }).status(StatusCodes.OK).json({
            message: "Successful login."
        })
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: err.message(),
        })
    }


})
router.post("/signup", async (req: Request, res: Response) => {
    const { username, password, address } = req.body as UserRequest;
    if (!username) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Username does not exist in body!"
        })
    }

    if (!password) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Password does not exist in body!"
        })
    }

    if (!address) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Address does not exist!"
        })
    }

    const userSchema = Joi.object({
        username: Joi.string().min(8).required(),
        password: Joi.string().min(10).required(),
        address: Joi.string().min(42).required()
    })

    const validation = userSchema.validate(req.body);

    if (validation?.error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: 'error',
            error: validation?.error?.details?.[0]?.message
        })
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        await User.create({
            username,
            password: hashedPassword,
            address
        });
        const token = jwt.sign({
            username,
            address
        }, configDotenv().parsed?.JWT_SECRET);
        return res.cookie("Authorization", `Bearer ${token}`, { maxAge: 1800000 }).status(StatusCodes.OK).json({
            message: "User has been successfully created."
        })
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: err.toString()
        })
    }
})

module.exports = router;