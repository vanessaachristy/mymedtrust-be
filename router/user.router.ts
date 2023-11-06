import express, { Request, Response } from 'express';
import { User } from '../schema/User.model';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRequest, UserType } from '../types/user';
import verifyToken from '../helper/token-verification';
import { configDotenv } from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { contract } from '..';
import { PatientCreatedEventObject } from '../types/abis/MainContract';

const router = express.Router();

router.get("/", verifyToken, async (req: UserRequest, res: Response) => {
    const user = await User.findOne({
        email: req.email
    });
    return res.status(StatusCodes.OK).json({
        email: user.email,
        address: user.address,
    })
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body as UserRequest;
    if (!email) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Email does not exist in body!"
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
            email
        });
        if (!user) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "User not found",
            })
        } else {
            const validation = await bcrypt.compare(password, user.password);
            if (!validation) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "error",
                    error: "Credentials are mismatched."
                })
            }
            const token = jwt.sign({
                email: user.email,
                address: user.address
            }, configDotenv()?.parsed?.JWT_SECRET);
            return res.cookie("Authorization", `Bearer ${token}`, { maxAge: 1800000 }).status(StatusCodes.OK).json({
                message: "Successful login."
            })
        }

    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: err.message,
        })
    }


})
router.post("/signup", async (req: Request, res: Response) => {
    const { email, password, address, name, ic, phone, birthdate, gender, homeAddress, userType } = req.body as UserRequest;
    if (!email) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Email does not exist in body!"
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

    if (!name) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Name does not exist!"
        })
    }

    if (!ic) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "IC does not exist!"
        })
    }
    if (!phone) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Phone does not exist!"
        })
    }
    if (!birthdate) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Birthdate does not exist!"
        })
    }

    if (!gender) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Gender does not exist!"
        })
    }

    if (!homeAddress) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "Home address does not exist!"
        })
    }

    if (!userType) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: "User type does not exist!"
        })
    }

    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().min(8).required(),
        password: Joi.string().min(10).required(),
        address: Joi.string().min(42).required()
    })

    const dataToValidate = {
        name: name,
        email: email,
        password: password,
        address: address
    }

    const validation = userSchema.validate(dataToValidate);

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
            name,
            email,
            password: hashedPassword,
            address
        });
        const token = jwt.sign({
            email,
            address
        }, configDotenv().parsed?.JWT_SECRET);
        let unixTS = Date.now();

        if (userType === UserType.PATIENT) {
            const { emergencyContact, bloodType, height, weight, account } = req.body as UserRequest;
            const senderAccount = account;
            const primaryInfo = {
                addr: address,
                IC: ic,
                name: name,
                gender: gender,
                birthdate: birthdate,
                email: email,
                homeAddress: homeAddress,
                phone: phone,
                userSince: unixTS
            };
            const emergencyContactName = emergencyContact.name;
            const emergencyContactNumber = emergencyContact.number;

            try {
                await contract.methods.createPatient(
                    {
                        ...primaryInfo,
                        userSince: unixTS
                    }, emergencyContactName, emergencyContactNumber, bloodType, height, weight, [], []
                ).send({ from: senderAccount, gas: "6721975" }).then(async (patientResponse) => {
                    // let patientData = patientResponse.logs[0].args;
                    const event = await contract.getPastEvents("PatientCreated", { fromBlock: 0, toBlock: "latest" });
                    const patientData = event[event.length - 1].returnValues as PatientCreatedEventObject;
                    // res.status(StatusCodes.OK).send({
                    //     message: "success",
                    //     data: {
                    //         address: patientData.patientAddr.toString(),
                    //         name: patientData.patientName.toString(),
                    //         IC: patientData.patientIC.toString(),
                    //         timestamp: new Date(Number(patientData.timestamp)).toString()
                    //     }
                    // })
                    res.cookie("Authorization", `Bearer ${token}`, { maxAge: 1800000 }).status(StatusCodes.OK).json({
                        message: "User has been successfully created.",
                        data: {
                            address: patientData.patientAddr.toString(),
                            name: patientData.patientName.toString(),
                            IC: patientData.patientIC.toString(),
                            timestamp: new Date(Number(patientData.timestamp)).toString()
                        }
                    })
                })
            } catch (err) {
                console.trace(err)
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "error",
                    error: err.toString()
                })
            }
        };
        // return res.cookie("Authorization", `Bearer ${token}`, { maxAge: 1800000 }).status(StatusCodes.OK).json({
        //     message: "User has been successfully created."
        // })
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "error",
            error: err.toString()
        })
    }
})

module.exports = router;