import express, { Express, Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import MainContract from "./MainContract.json"
import web3, { eth } from "web3";


//For env File 
dotenv.config();

const web3js = new web3(
    new web3.providers.WebsocketProvider("ws://127.0.0.1:7545")
);

const app: Application = express();
app.use(express.urlencoded());
app.use(express.json());
const port = process.env.PORT || 3000;

const contractAbi = MainContract.abi;
const contractAddress = MainContract.networks[5777].address;
const contract = new web3js.eth.Contract(contractAbi, contractAddress) as any;


app.get('/', (req: Request, res: Response) => {
    res.send('Welcome to Express & TypeScript Server');
});

app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});

/**
 * Get accounts
 */
app.get("/accounts", async function (req: Request, res: Response) {
    res.json({
        data: {
            accounts: await web3js.eth.getAccounts(),
        },
    });
});

/**
 * Get all patients
 */
app.get("/patients", async function (req: Request, res: Response) {
    res.header("Access-Control-Allow-Origin", "*");
    const totalPatients = await contract.methods.totalPatients().call();
    let patients = [];
    for (let i = 1; i <= Number(totalPatients); i++) {
        let patientAddr = await contract.methods.patients(i).call();
        let patient = await contract.methods.getPatientDetails(patientAddr).call();
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
                    whitelistedDoctor: patient.whitelistedDoctor,
                    recordList: patient.recordList
                },
                emergencyContact: patient.emergencyContact.toString(),
                emergencyNumber: patient.emergencyNumber.toString(),
                bloodType: patient.bloodType.toString(),
                height: patient.height.toString(),
                weight: patient.weight.toString()
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
 * Get patients by address
 */
app.get("/patients/:address", async function (req: Request, res: Response) {
    res.header("Access-Control-Allow-Origin", "*");
    const address: string = req.params["address"];
    try {
        let patient = await contract.methods.getPatientDetails(address).call();
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
    } catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Address invalid!"
        }
        res.status(400).json({
            message: "error",
            error: errMessage
        })
    }
});


/**
 * Create patient
 */
app.post("/createPatient", async function (req: Request, res: Response) {
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
            console.log(patientResponse)
            // let patientData = patientResponse.logs[0].args;
            const event = await contract.getPastEvents("PatientCreated", { fromBlock: 0, toBlock: "latest" });
            const patientData = event[event.length - 1].returnValues;
            res.status(200).send({
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
        res.status(400).json({
            message: "error",
            error: err.toString()
        })
    }
});

/**
 * Get all doctors
 */
app.get("/doctors", async function (req: Request, res: Response) {
    res.header("Access-Control-Allow-Origin", "*");
    const totalDoctors = await contract.methods.totalDoctors().call();
    let doctors = [];
    for (let i = 1; i <= Number(totalDoctors); i++) {
        let doctorAddr = await contract.methods.doctors(i).call();
        let doctor = await contract.methods.getDoctorDetails(doctorAddr).call();
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
app.get("/doctors/:address", async function (req: Request, res: Response) {
    res.header("Access-Control-Allow-Origin", "*");
    const address: string = req.params["address"];
    try {
        let doctor = await contract.methods.getDoctorDetails(address).call();
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
        res.status(400).json({
            message: "error",
            error: errMessage
        })
    }
});



/**
 * Create doctor
 */
app.post("/createDoctor", async function (req: Request, res: Response) {
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
            const doctorData = event[event.length - 1].returnValues;
            res.status(200).send({
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
        res.status(400).json({
            message: "error",
            error: err.toString()
        })
    }
});

/**
 * Whitelist a doctor
 */
app.post("/whitelist", async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;

    try {

        await contract.methods.addWhitelistedDoctor(doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
            console.log(response);
            const event = await contract.getPastEvents("WhitelistDoctor", { fromBlock: 0, toBlock: "latest" });
            const whitelistData = event[event.length - 1].returnValues;
            console.log(Number(whitelistData.timestamp));

            res.status(200).send({
                message: "success",
                data: {
                    patient: whitelistData.patientAddr.toString(),
                    doctor: whitelistData.doctorAddr.toString(),
                    timestamp: new Date(Number(whitelistData.timestamp) * 1000).toString()
                }
            })
        })
    }
    catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Address invalid!"
        }
        res.status(400).json({
            message: "error",
            error: errMessage
        })
    }

})

/**
 * Remove whitelisted doctor
 */
app.post("/whitelist/remove", async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;

    try {
        await contract.methods.removeWhitelistedDoctor(doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then((response) => {
            console.log(response);
            res.status(200).send({
                message: "success"
            })
        })
    } catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Address invalid!"
        }
        res.status(400).json({
            message: "error",
            error: errMessage
        })
    }

})

/**
 * Add record to patient
 */
app.post("/record/add", async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;
    const encryptedID = req.body.encryptedID;
    const dataHash = req.body.dataHash;

    try {
        await contract.methods.createRecord(encryptedID, dataHash, doctorAddress, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
            console.log(response);
            const event = await contract.getPastEvents("RecordCreated", { fromBlock: 0, toBlock: "latest" });
            const recordData = event[event.length - 1].returnValues;
            res.status(200).send({
                message: "success",
                data: {
                    dataID: recordData.encryptedID.toString(),
                    patient: recordData.patientAddr.toString(),
                    doctor: recordData.issuerDoctorAddr.toString(),
                    timestamp: new Date(Number(recordData.timestamp) * 1000).toString(),
                    status: recordData.recordStatus.toString()
                }
            })
        })
    } catch (err) {
        // let errMessage = "Invalid request";
        // if (err.errors[0].message.toString().includes('must pass "address" validation')) {
        //     errMessage = "Address invalid!"
        // }
        res.status(400).json({
            message: "error",
            error: err.toString()
        })
    }
})


/**
 * Remove record
 */
app.post("/record/remove", async function (req: Request, res: Response) {
    const senderAccount = req.body.account;
    const patientAddress = req.body.patient;
    const doctorAddress = req.body.doctor;
    const encryptedID = req.body.encryptedID;
    const dataHash = req.body.dataHash;

    try {
        await contract.methods.removeRecord(encryptedID, patientAddress).send({ from: senderAccount, gas: "6721975" }).then(async (response) => {
            console.log(response);
            res.status(200).send({
                message: "success"
            })
        })
    } catch (err) {
        console.trace(err);
        let errMessage = "Invalid request";
        if (err.errors[0].message.toString().includes('must pass "address" validation')) {
            errMessage = "Address invalid!"
        }
        res.status(400).json({
            message: "error",
            error: errMessage
        })
    }
})