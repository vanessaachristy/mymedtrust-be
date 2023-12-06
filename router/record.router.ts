import express, { Request, Response } from 'express';
import { contract, recordContract } from "..";
import { MainContract, RecordContract } from "../types/abis";
import { RecordCreatedEventObject } from '../types/abis/RecordContract';
import { RecordStatus } from '../types/record';
import { StatusCodes } from 'http-status-codes';
import verifyToken from '../helper/token-verification';

const router = express.Router();

const observationRouter = require("./db-records/observation.router");
const conditionRouter = require("./db-records/condition.router");

router.use('/observation', observationRouter);
router.use('/condition', conditionRouter)

/**
 * Add record to patient
 */
router.post("/add", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;
    const encryptedID = req.body.encryptedID;
    const dataHash = req.body.dataHash;

    try {

        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000'
        if (patientExist) {
            const recordExist = patient.recordList.includes(encryptedID);
            if (!recordExist) {
                const doctorIsWhitelisted = patient.whitelistedDoctor.includes(doctorAddress);
                if (doctorIsWhitelisted) {
                    const recordList = await recordContract.methods;
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
                                    status: Number(recordData.recordStatus)
                                }
                            })
                        })
                    })
                } else {
                    res.status(StatusCodes.OK).send({
                        message: 'success',
                        error: "Doctor is not whitelisted"
                    })
                }
            } else {
                res.status(StatusCodes.OK).send({
                    message: 'success',
                    error: "Record with same ID already exist"
                })
            }
        } else {
            res.status(StatusCodes.OK).send({
                message: 'success',
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

/**
 * Edit record
 */
router.post("/edit", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const encryptedID = req.body.encryptedID;
    const dataHash = req.body.dataHash;
    const recordStatus: RecordStatus = req.body.recordStatus;

    try {
        const record = await recordContract.methods.recordList(encryptedID).call() as RecordContract.RecordStructOutput;
        const recordExist = record.encryptedID === encryptedID;
        const recordPatientAddr = record.patientAddr.toString();
        const recordDoctorAddr = record.issuerDoctorAddr.toString();
        const validSender = recordDoctorAddr === senderAccount || recordPatientAddr === senderAccount;
        if (recordExist) {
            if (validSender) {
                await recordContract.methods.editRecord(encryptedID, dataHash, recordStatus).send({ from: senderAccount, gas: "6721975" }).then((response) => {
                    res.status(StatusCodes.OK).send({
                        message: "success"
                    })
                })
            } else {
                res.status(StatusCodes.BAD_REQUEST).json({
                    message: "error",
                    error: "Sender must be the issuer doctor!"
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

/**
 * Remove record
 */
router.post("/remove", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const encryptedID = req.body.encryptedID;

    try {
        await contract.methods.removeRecord(encryptedID, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
            await recordContract.methods.removeRecord(encryptedID).send({ from: senderAccount, gas: '6721975' }).then(async (_response) => {
                res.status(StatusCodes.OK).send({
                    message: "success"
                })
            })
        })
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