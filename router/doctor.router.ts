import express, { Request, Response } from 'express';
import { contract } from "..";
import { MainContract } from "../types/abis";
import { AddressType } from "typechain";
import { DoctorCreatedEventObject, WhitelistDoctorEventObject } from '../types/abis/MainContract';
import { StatusCodes } from 'http-status-codes';
import verifyToken from '../helper/token-verification';
import { User } from '../schema/User.model';
import { UserType } from '../types/user';

const router = express.Router();

/**
 * Get all doctors
 */
router.get("/", verifyToken, async function (req: Request, res: Response) {
    const totalDoctors = await contract.methods.totalDoctors().call();
    let doctors = [];
    for (let i = 1; i <= Number(totalDoctors); i++) {
        let doctorAddr = await contract.methods.doctors(i).call() as AddressType;
        let doctor = await contract.methods.getDoctorDetails(doctorAddr).call() as MainContract.DoctorStructOutput;
        if (doctorAddr.toString() !== '0x0000000000000000000000000000000000000000') {
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
            doctors.push(doctorObj);
        }
    }

    res.json({
        data: {
            total: Number(totalDoctors),
            doctors: doctors
        }
    })
});


/**
 * Get doctor by address
 */
router.get("/:address", verifyToken, async function (req: Request, res: Response) {
    const address: string = req.params["address"];
    try {
        let doctor = await contract.methods.getDoctorDetails(address).call() as MainContract.DoctorStructOutput;
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
        res.json({
            data: doctorObj
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
});

/**
 * Get doctor's patient list
 */
router.get("/:address/patients", verifyToken, async function (req: Request, res: Response) {
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
})


/**
 * Create doctor
 */
router.post("/create", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const primaryInfo = req.body.primaryInfo;
    const qualification = req.body.qualification;
    const major = req.body.major;

    let unixTS = Date.now();
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
        console.trace(err);
        res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
});

/**
 * Whitelist a doctor
 */
router.post("/whitelist", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;

    try {

        const patient = await contract.methods.getPatientDetails(patientAddress).call();
        if (!patient.whitelistedDoctor.includes(doctorAddress)) {
            await contract.methods.addWhitelistedDoctor(doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
                console.log(response);
                const event = await contract.getPastEvents("WhitelistDoctor", { fromBlock: 0, toBlock: "latest" });
                const whitelistData = event[event.length - 1].returnValues as WhitelistDoctorEventObject;
                console.log(Number(whitelistData.timestamp));

                res.status(StatusCodes.OK).send({
                    message: "success",
                    data: {
                        patient: whitelistData.patientAddr.toString(),
                        doctor: whitelistData.doctorAddr.toString(),
                        timestamp: new Date(Number(whitelistData.timestamp) * 1000).toString()
                    }
                })
            })
        } else {
            res.status(StatusCodes.OK).json({
                message: "success",
                data: "Doctor has already been whitelisted"
            })
        }
    }
    catch (err) {
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

/**
 * Remove whitelisted doctor
 */
router.post("/whitelist/remove", verifyToken, async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;

    try {
        await contract.methods.removeWhitelistedDoctor(doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then((response) => {
            console.log(response);
            res.status(StatusCodes.OK).send({
                message: "success"
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