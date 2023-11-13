import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import MainContract from "./abis/MainContract.json";
import RecordContract from "./abis/RecordContract.json";
import web3 from "web3";
import { mongoUrl } from './schema/const';
import { connect } from 'mongoose';
import cors from 'cors';

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
export const contract = new web3js.eth.Contract(contractAbi, contractAddress) as any;

const recordContractAbi = RecordContract.abi;
const recordContractAddress = RecordContract.networks[5777].address;
export const recordContract = new web3js.eth.Contract(recordContractAbi, recordContractAddress) as any;

app.get('/', (req: Request, res: Response) => {
    res.send("Welcome to MyMedTrust!")
});

app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
    connect(mongoUrl)
        .then((db) => {
            console.log("connected to database!");
        })
        .catch((err) => console.log(err.response));


});

const cookies = require("cookie-parser");
app.use(cookies());

const patientRouter = require("./router/patient.router")
const doctorRouter = require("./router/doctor.router");
const recordRouter = require("./router/record.router");
const userRouter = require("./router/user.router");

app.use(
    cors({
        origin: "http://localhost:3001",
        credentials: true,
    })
);
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); // Replace with your frontend's origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Credentials', 'true'); // Allow cookies
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

app.use('/patient', patientRouter);
app.use('/doctor', doctorRouter);
app.use('/record', recordRouter);
app.use('/user', userRouter);

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
