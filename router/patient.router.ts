import express, { Request, Response } from "express";
import { contract, recordContract } from "..";
import { MainContract, RecordContract } from "../types/abis";
import { AddressType } from "typechain";
import { PatientCreatedEventObject } from "../types/abis/MainContract";
import { RecordStatus } from "../types/record";
import { StatusCodes } from "http-status-codes";
import verifyToken from "../helper/token-verification";
import { Observation } from "../schema/Observation.model";
import { Condition } from "../schema/Condition.model";
import { Allergy } from "../schema/Allergy.model";
import { Medication } from "../schema/Medication.model";
import { EMPTY_ADDRESS } from "../common/const";

const router = express.Router();

/**
 * Get all patients
 */
router.get("/", verifyToken, async function (req: Request, res: Response) {
    const totalPatients = Number(await contract.methods.totalPatients().call());
    let patients = [];
    for (let i = 1; i <= Number(totalPatients); i++) {
        let patientAddr = (await contract.methods.patients(i).call()) as AddressType;
        let patient = (await contract.methods.getPatientDetails(patientAddr).call()) as MainContract.PatientStructOutput;
        if (patientAddr.toString() !== '0x0000000000000000000000000000000000000000') {
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
                },
                emergencyContact: patient.emergencyContact.toString(),
                emergencyNumber: patient.emergencyNumber.toString(),
                bloodType: patient.bloodType.toString(),
                height: patient.height.toString(),
                weight: patient.weight.toString(),
                whitelistedDoctor: patient.whitelistedDoctor,
                recordList: patient.recordList
            }
            patients.push(patientObj);
        }
    }

    res.json({
        data: {
            total: Number(totalPatients),
            patients: patients
        }
    })
});

/**
 * Get patients by doctor
 */
router.get("/doctor/:address", verifyToken, async function (req: Request, res: Response) {
    const doctorAddress: string = req.params["address"];
    const totalPatients = Number(await contract.methods.totalPatients().call());
    let patientsCount = 0;
    let patients = [];
    for (let i = 1; i <= Number(totalPatients); i++) {
        let patientAddr = (await contract.methods.patients(i).call()) as AddressType;
        let patient = (await contract.methods.getPatientDetails(patientAddr).call()) as MainContract.PatientStructOutput;
        if (patientAddr.toString() !== '0x0000000000000000000000000000000000000000' && patient.whitelistedDoctor.includes(doctorAddress)) {
            patientsCount++;
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
                },
                emergencyContact: patient.emergencyContact.toString(),
                emergencyNumber: patient.emergencyNumber.toString(),
                bloodType: patient.bloodType.toString(),
                height: patient.height.toString(),
                weight: patient.weight.toString(),
                whitelistedDoctor: patient.whitelistedDoctor,
                recordList: patient.recordList
            }
            patients.push(patientObj);
        }
    }

    res.json({
        data: {
            total: Number(patientsCount),
            patients: patients
        }
    })
});


/**
 * Get patients by address
 */
router.get("/:address", verifyToken, async function (req: Request, res: Response) {
    const address: string = req.params["address"];
    try {
        let patient = await contract.methods.getPatientDetails(address).call();

        if (patient.primaryInfo.addr.toString() === EMPTY_ADDRESS) {
            res.status(StatusCodes.BAD_REQUEST).json({
                message: 'error',
                error: "Patient address not exist!"
            })
        } else {
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
            res.json({
                data: patientObj
            })
        }

    } catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Patient address not exist!"
        }
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: errMessage
        })
    }
});


/**
 * Create patient
 */
router.post("/create", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const primaryInfo = req.body.primaryInfo;
    const emergencyContact = req.body.emergencyContact;
    const emergencyNumber = req.body.emergencyNumber;
    const bloodType = req.body.bloodType;
    const height = req.body.height;
    const weight = req.body.weight;

    let unixTS = Date.now();
    try {
        await contract.methods.createPatient(
            {
                ...primaryInfo,
                userSince: unixTS
            }, emergencyContact, emergencyNumber, bloodType, height, weight, [], []
        ).send({ from: senderAccount, gas: "6721975" }).then(async (patientResponse) => {
            // let patientData = patientResponse.logs[0].args;
            const event = await contract.getPastEvents("PatientCreated", { fromBlock: 0, toBlock: "latest" });
            const patientData = event[event.length - 1].returnValues as PatientCreatedEventObject;
            res.status(StatusCodes.OK).send({
                message: "success",
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
});

/**
 * Get patient record details
 */
router.get("/record/:address", verifyToken, async function (req: Request, res: Response) {
    const patientAddress = req.params['address'];

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000';

        if (patientExist) {
            const recordList = patient.recordList;
            const records = [];
            for (let i = 0; i < recordList.length; i++) {
                const record = await recordContract.methods.recordList(recordList[i]).call() as RecordContract.RecordStructOutput;
                let doctor = await contract.methods.getDoctorDetails(record.issuerDoctorAddr).call() as MainContract.DoctorStructOutput;
                let recordObject = {
                    encryptedID: record.encryptedID,
                    dataHash: record.dataHash,
                    issuerDoctorAddr: record.issuerDoctorAddr,
                    issuerDoctorName: doctor.primaryInfo.name.toString(),
                    patientAddr: record.patientAddr,
                    timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                    recordStatus: Number(record.recordStatus as RecordStatus),
                }

                const promises = [
                    Observation.findOne({
                        _id: record.encryptedID
                    }),
                    Condition.findOne({
                        _id: record.encryptedID
                    }), Medication.findOne({
                        _id: record.encryptedID
                    }),

                    Allergy.findOne({
                        _id: record.encryptedID
                    }),]

                const promiseData = await Promise.all(promises);
                recordObject['data'] = promiseData.filter(data => data !== null)[0];

                records.push(recordObject);
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

/**
 * Get patient observation record
 */
router.get("/record/observation/:address", verifyToken, async function (req: Request, res: Response) {
    const patientAddress = req.params['address'];

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000';

        if (patientExist) {
            const recordList = patient.recordList;
            const records = [];
            for (let i = 0; i < recordList.length; i++) {
                const record = await recordContract.methods.recordList(recordList[i]).call() as RecordContract.RecordStructOutput;
                const observation = await Observation.findOne({
                    _id: record.encryptedID
                });
                if (observation) {
                    records.push(
                        {
                            encryptedID: record.encryptedID,
                            dataHash: record.dataHash,
                            issuerDoctorAddr: record.issuerDoctorAddr,
                            patientAddr: record.patientAddr,
                            timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                            recordStatus: Number(record.recordStatus as RecordStatus),
                            data: observation
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

/**
 * Get patient condition record
 */
router.get("/record/condition/:address", verifyToken, async function (req: Request, res: Response) {
    const patientAddress = req.params['address'];

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000';

        if (patientExist) {
            const recordList = patient.recordList;
            const records = [];
            for (let i = 0; i < recordList.length; i++) {
                const record = await recordContract.methods.recordList(recordList[i]).call() as RecordContract.RecordStructOutput;
                const condition = await Condition.findOne({
                    _id: record.encryptedID
                });
                if (condition) {
                    records.push(
                        {
                            encryptedID: record.encryptedID,
                            dataHash: record.dataHash,
                            issuerDoctorAddr: record.issuerDoctorAddr,
                            patientAddr: record.patientAddr,
                            timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                            recordStatus: Number(record.recordStatus as RecordStatus),
                            data: condition
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

/**
 * Get patient allergy record
 */
router.get("/record/allergy/:address", verifyToken, async function (req: Request, res: Response) {
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

/**
 * Get patient medication record
 */
router.get("/record/medication/:address", verifyToken, async function (req: Request, res: Response) {
    const patientAddress = req.params['address'];

    try {
        const patient = await contract.methods.getPatientDetails(patientAddress).call() as MainContract.PatientStructOutput;
        const patientExist = patient.primaryInfo.addr !== '0x0000000000000000000000000000000000000000';

        if (patientExist) {
            const recordList = patient.recordList;
            const records = [];
            for (let i = 0; i < recordList.length; i++) {
                const record = await recordContract.methods.recordList(recordList[i]).call() as RecordContract.RecordStructOutput;
                const medication = await Medication.findOne({
                    _id: record.encryptedID
                });
                if (medication) {
                    records.push(
                        {
                            encryptedID: record.encryptedID,
                            dataHash: record.dataHash,
                            issuerDoctorAddr: record.issuerDoctorAddr,
                            patientAddr: record.patientAddr,
                            timestamp: new Date(Number(record.timestamp) * 1000).toString(),
                            recordStatus: Number(record.recordStatus as RecordStatus),
                            data: medication
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



module.exports = router;