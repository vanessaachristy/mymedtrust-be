import express, { Request, Response } from 'express';
import { User } from '../schema/User.model';
import Joi from '@hapi/joi';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UserRequest, UserType } from '../types/user';
import verifyToken from '../helper/token-verification';
import { configDotenv } from 'dotenv';
import { StatusCodes } from 'http-status-codes';
import { contract } from '..';
import { DoctorCreatedEventObject, MainContract, PatientCreatedEventObject } from '../types/abis/MainContract';
import dotenv from 'dotenv';


const router = express.Router();

router.get("/", verifyToken, async (req: UserRequest, res: Response) => {
    const user = await User.findOne({
        email: req.email
    });

    if (user.userType === UserType.DOCTOR) {
        let doctor = await contract.methods.getDoctorDetails(user.address).call() as MainContract.DoctorStructOutput;
        let doctorObj = {
            primaryInfo: {
                address: doctor.primaryInfo.addr.toString(),
                IC: doctor.primaryInfo.IC.toString(),
                name: doctor.primaryInfo.name.toString(),
                gender: doctor.primaryInfo.gender.toString(),
                birthdate: doctor.primaryInfo.birthdate.toString(),
                email: doctor.primaryInfo.email.toString(),
                homeAddress: doctor.primaryInfo.homeAddress.toString(),
                phone: doctor.primaryInfo.phone.toString(),
                userSince: Number(doctor.primaryInfo.userSince) !== 0 ? new Date(Number(doctor.primaryInfo.userSince)).toString() : ""
            },
            qualification: doctor.qualification.toString(),
            major: doctor.major.toString(),
        }
        return res.status(StatusCodes.OK).json({
            email: user.email,
            address: user.address,
            userType: user.userType,
            ...doctorObj
        })
    } else if (user.userType === UserType.PATIENT) {
        let patient = await contract.methods.getPatientDetails(user.address).call();
        let patientObj = {
            primaryInfo: {
                address: patient.primaryInfo.addr.toString(),
                IC: patient.primaryInfo.IC.toString(),
                name: patient.primaryInfo.name.toString(),
                gender: patient.primaryInfo.gender.toString(),
                birthdate: patient.primaryInfo.birthdate.toString(),
                email: patient.primaryInfo.email.toString(),
                homeAddress: patient.primaryInfo.homeAddress.toString(),
                phone: patient.primaryInfo.phone.toString(),
                userSince: Number(patient.primaryInfo.userSince) !== 0 ? new Date(Number(patient.primaryInfo.userSince)).toString() : "",
                whitelistedDoctor: patient.whitelistedDoctor,
                recordList: patient.recordList
            },
            emergencyContact: patient.emergencyContact.toString(),
            emergencyNumber: patient.emergencyNumber.toString(),
            bloodType: patient.bloodType.toString(),
            height: patient.height.toString(),
            weight: patient.weight.toString()
        }
        return res.status(StatusCodes.OK).json({
            email: user.email,
            address: user.address,
            userType: user.userType,
            ...patientObj
        })
    }
    else {
        let patientObj = {
            primaryInfo: {
                address: user.address,
                IC: user.IC,
                name: user.name,
                gender: user.gender,
                birthdate: user.birthdate,
                email: user.email,
                homeAddress: user.homeAddress,
                phone: user.phone,
                userSince: user.userSince
            }
        }
        return res.status(StatusCodes.OK).json({
            email: user.email,
            address: user.address,
            userType: user.userType,
            ...patientObj

        })
    }



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
                message: "User not found!",
            })
        } else {
            const validation = await bcrypt.compare(password, user.password);
            if (!validation) {
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "Wrong password!"
                })
            }
            const token = jwt.sign({
                email: user.email,
                address: user.address
            }, configDotenv()?.parsed?.JWT_SECRET);
            return res.cookie("Authorization", `Bearer ${token}`, { maxAge: 432000000, sameSite: "none", secure: true }).status(StatusCodes.OK).json({
                message: "Successful login!",
                data: {
                    email: user.email,
                    address: user.address
                }
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
            message: "Email does not exist in body!"
        })
    }

    if (!password) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Password does not exist in body!"
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
            message: "Name does not exist!"
        })
    }

    if (!ic) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "IC does not exist!"
        })
    }
    if (!phone) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Phone does not exist!"
        })
    }
    if (!birthdate) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Birthdate does not exist!"
        })
    }

    if (!gender) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Gender does not exist!"
        })
    }

    if (!homeAddress) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "Home address does not exist!"
        })
    }

    if (!userType) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: "User type does not exist!"
        })
    }

    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().min(8).required(),
        password: Joi.string().min(10).required(),
        address: Joi.string().min(42).required(),
        userType: Joi.string().required()
    })

    const dataToValidate = {
        name: name,
        email: email,
        password: password,
        address: address,
        userType: userType
    }

    const validation = userSchema.validate(dataToValidate);

    if (validation?.error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            message: `${validation?.error?.details?.[0]?.message}`,
        })
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const emailExist = await User.findOne({
        email: email
    });
    const addressExist = await User.findOne({
        address: address
    });

    if (emailExist) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: `Email already used!`
        })
    }
    if (addressExist) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: `Address already used!`
        })
    }

    try {
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

            await User.create({
                name,
                email,
                password: hashedPassword,
                address,
                userType,
                birthdate,
                IC: ic,
                gender,
                homeAddress,
                phone,
                userSince: unixTS
            });

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
                    res.cookie("Authorization", `Bearer ${token}`, {
                        maxAge: 432000000
                    }).status(StatusCodes.OK).json({
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
                    message: err.toString(),
                })
            }
        } else if (userType === UserType.DOCTOR) {
            const { qualification, major, account } = req.body as UserRequest;
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

            await User.create({
                name,
                email,
                password: hashedPassword,
                address,
                userType,
                birthdate,
                IC: ic,
                gender,
                homeAddress,
                phone,
                userSince: unixTS

            });

            try {
                await contract.methods.createDoctor(
                    {
                        ...primaryInfo,
                        userSince: unixTS
                    }, qualification, major
                ).send({ from: senderAccount, gas: "6721975" }).then(async (doctorResponse) => {
                    console.log(doctorResponse)
                    const event = await contract.getPastEvents("DoctorCreated", { fromBlock: 0, toBlock: "latest" });
                    const doctorData = event[event.length - 1].returnValues as DoctorCreatedEventObject;
                    res.status(StatusCodes.OK).send({
                        message: "success",
                        data: {
                            address: doctorData.doctorAddr.toString(),
                            name: doctorData.doctorName.toString(),
                            IC: doctorData.doctorIC.toString(),
                            timestamp: new Date(Number(doctorData.timestamp)).toString()
                        }
                    })
                })
            } catch (err) {
                console.trace(err)
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: err.toString(),
                })
            }
        } else if (userType === UserType.ADMIN) {

            const { adminKey } = req.body as UserRequest;
            if (adminKey === 'abc123') {
                await User.create({
                    name,
                    email,
                    password: hashedPassword,
                    address,
                    userType,
                    birthdate,
                    IC: ic,
                    gender,
                    homeAddress,
                    phone,
                    userSince: unixTS
                }).then(async () => {
                    const createdUser = await User.findOne({ email });

                    if (createdUser) {
                        res.status(StatusCodes.OK).send({
                            message: "success",
                            data: {
                                name: createdUser.name,
                                email: createdUser.email,
                                address: createdUser.address
                            }
                        });
                    } else {
                        res.status(StatusCodes.NOT_FOUND).send({
                            message: "User not found after creation",
                        });
                    }
                })
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: `Invalid adminKey: ${adminKey}`,
                })
            }

        } else {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: `Invalid user type: ${userType}`,
            })
        }
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: `${err.toString()}`,
        })
    }
})



router.get("/user", verifyToken, async (req: Request, res: Response) => {
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
        res.status(StatusCodes.OK).send({
            message: "success",
            data: {
                email: email,
                address: address,
            }
        })

    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: err.message
        })
    }

})

module.exports = router;