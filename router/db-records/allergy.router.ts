import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import verifyToken from '../../helper/token-verification';
import { contract, recordContract } from '../..';
import { MainContract } from '../../types/abis';
import { RecordContract } from '../../types/abis/RecordContract';
import { RecordCreatedEventObject } from '../../types/abis/RecordContract';
import mongoose from 'mongoose';
import { EMPTY_ADDRESS } from '../../common/const';
import { RecordStatus } from '../../types/record';
import { Allergy, requiredAttrs } from '../../schema/Allergy.model';
import { AllergyIntolerance as IAllergy } from 'fhir/r4';


const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const allergies = await Allergy.find();
        res.status(StatusCodes.OK).json({
            message: 'success',
            data: allergies
        })
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})


router.get("/:id", verifyToken, async (req: Request, res: Response) => {
    try {
        const recordID = req.params['id'];
        const record = await recordContract.methods.recordList(recordID).call() as RecordContract.RecordStructOutput;
        const allergy = await Allergy.findOne({
            _id: recordID
        });
        const recordExist = record.encryptedID && record.dataHash && record.issuerDoctorAddr !== EMPTY_ADDRESS && record.patientAddr !== EMPTY_ADDRESS && allergy && allergy._id;
        if (recordExist) {
            const validRecord = atob(record.dataHash) === JSON.stringify(allergy.toJSON());

            if (validRecord) {
                res.status(StatusCodes.OK).send({
                    message: "success",
                    encryptedID: record.encryptedID,
                    dataHash: record.dataHash,
                    issuerDoctorAddr: record.issuerDoctorAddr,
                    patientAddr: record.patientAddr,
                    timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                    recordStatus: Number(record.recordStatus as RecordStatus),
                    data: allergy
                })
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "error",
                    error: "Mismatched record in blockchain and database."
                })
            }


        } else {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "error",
                error: "Record does not exist"
            })
        }
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})


/**
 * Get patient allergy record
 */
router.get("/patient/:address", verifyToken, async function (req: Request, res: Response) {
    const patientAddress = req.params['address'];

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000';

        if (patientExist) {
            const recordList = patient.recordList;
            const records = [];
            for (let i = 0; i < recordList.length; i++) {
                const record = await recordContract.methods.recordList(recordList[i]).call() as RecordContract.RecordStructOutput;
                const allergy = await Allergy.findOne({
                    _id: record.encryptedID
                });
                if (allergy) {
                    records.push(
                        {
                            encryptedID: record.encryptedID,
                            dataHash: record.dataHash,
                            issuerDoctorAddr: record.issuerDoctorAddr,
                            patientAddr: record.patientAddr,
                            timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                            recordStatus: Number(record.recordStatus as RecordStatus),
                            data: allergy
                        }
                    )
                };
            }
            res.status(StatusCodes.OK).send({
                message: "success",
                data: records
            })
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "error",
                error: "Patient does not exist"
            })
        }
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})

router.post("/create", verifyToken, async (req: Request, res: Response) => {
    const body = req.body as IAllergy & {
        account: string;
        doctorAddr: string;
        patientAddr: string; // change to patientAddr bcs the allergy FHIR R4 data types also has 'patient' attribute
        additionalNote?: string;
    };
    for (let i = 0; i < requiredAttrs.length; i++) {
        if (!body[requiredAttrs[i]]) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: 'error',
                error: `Parameter ${requiredAttrs[i]} does not exist in body!`
            })
        }
    }
    const senderAccount = body.account;
    const patientAddress = body.patientAddr;
    const doctorAddress = body.doctorAddr;

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000'

        const mongoID = new mongoose.mongo.ObjectId();
        const encryptedID = mongoID.toString();

        if (patientExist) {
            const recordExist = patient.recordList.includes(encryptedID);
            if (!recordExist) {
                const doctorIsWhitelisted = patient.whitelistedDoctor.includes(doctorAddress) && patient.whitelistedDoctor.includes(senderAccount);
                if (doctorIsWhitelisted) {
                    const allergy = await Allergy.create({
                        ...body,
                        _id: mongoID,
                        timestamp: new Date().toString()
                    });
                    const queriedObservation = await Allergy.findOne({
                        _id: mongoID
                    })
                    const dataHash = btoa(JSON.stringify(queriedObservation.toJSON()));

                    await recordContract.methods.createRecord(encryptedID, dataHash, doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
                        await contract.methods.createRecord(encryptedID, patientAddress).send({ from: senderAccount, gas: '6721975' }).then(async (_response) => {
                            const event = await recordContract.getPastEvents("RecordCreated", { fromBlock: 0, toBlock: "latest" });
                            const recordData = event[event.length - 1].returnValues as RecordCreatedEventObject;
                            res.status(StatusCodes.OK).send({
                                message: "success",
                                data: {
                                    dataID: recordData.encryptedID.toString(),
                                    patient: recordData.patientAddr.toString(),
                                    doctor: recordData.issuerDoctorAddr.toString(),
                                    timestamp: new Date(Number(recordData.timestamp) * 1000).toString(),
                                    status: Number(recordData.recordStatus),
                                    allergy: allergy
                                }
                            })
                        })

                    })
                } else {
                    res.status(StatusCodes.BAD_REQUEST).send({
                        message: 'error',
                        error: "Doctor is not whitelisted"
                    })
                }
            } else {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'error',
                    error: "Record with same ID already exist"
                })
            }
        } else {
            res.status(StatusCodes.BAD_REQUEST).send({
                message: 'error',
                error: "Patient is not exist"
            })
        };

    } catch (err) {
        // let errMessage = "Invalid request";
        // if (err.errors[0].message.toString().includes('must pass "address" validation')) {
        //     errMessage = "Address invalid!"
        // }
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})

router.post("/edit", verifyToken, async (req: Request, res: Response) => {
    const senderAccount = req.body.account;
    const encryptedID = req.body.encryptedID;
    const recordStatus: RecordStatus = req.body.recordStatus;

    const body = req.body as IAllergy & {
        account: string;
        doctorAddr: string;
        patientAddr: string; // change to patientAddr bcs the allergy FHIR R4 data types also has 'patient' attribute
    };

    try {
        const record = await recordContract.methods.recordList(encryptedID).call() as RecordContract.RecordStructOutput;
        const recordExist = record.encryptedID === encryptedID;
        const recordPatientAddr = record.patientAddr.toString();
        const recordDoctorAddr = record.issuerDoctorAddr.toString();
        const validSender = recordDoctorAddr === senderAccount || recordPatientAddr === senderAccount;

        if (recordExist) {
            if (validSender) {
                await Allergy.updateOne({
                    ...body,
                    _id: encryptedID,
                    timestamp: new Date().toString()
                });
                const queriedObservation = await Allergy.findOne({
                    _id: encryptedID
                })
                const dataHash = btoa(JSON.stringify(queriedObservation.toJSON()));
                await recordContract.methods.editRecord(encryptedID, dataHash, recordStatus).send({ from: senderAccount, gas: "6721975" }).then((response) => {
                    res.status(StatusCodes.OK).send({
                        message: "success",
                        data: queriedObservation
                    })
                })
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "error",
                    error: "Invalid sender!"
                })
            }
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "error",
                error: "Record does not exist."

            })
        }
    } catch (err) {
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})

router.post("/delete", verifyToken, async (req: Request, res: Response) => {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const encryptedID = req.body.encryptedID;

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000'
        const validSender = patient.whitelistedDoctor.includes(senderAccount) || senderAccount === patientAddress;

        if (validSender) {
            if (patientExist) {
                const recordExist = patient.recordList.includes(encryptedID);
                if (recordExist) {
                    await Allergy.deleteOne({
                        _id: encryptedID
                    }).then(async (_) => {
                        await contract.methods.removeRecord(encryptedID, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (_) => {
                            await recordContract.methods.removeRecord(encryptedID).send({ from: senderAccount, gas: '6721975' }).then(async (_res) => {
                                res.status(StatusCodes.OK).send({
                                    message: "success"
                                })
                            })

                        });
                    })
                } else {
                    res.status(StatusCodes.BAD_REQUEST).json({
                        message: "error",
                        error: "Record does not exist."
                    })
                }
            } else {
                res.status(StatusCodes.OK).send({
                    message: 'success',
                    error: "Patient is not exist"
                })
            }
        } else {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: "error",
                error: "Sender is not allowed."

            })
        }

    } catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Address invalid!"
        }
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: errMessage
        })
    }
})
module.exports = router;