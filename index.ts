import express, { Request, Response, Application } from 'express';
import dotenv from 'dotenv';
import MainContract from "./abis/MainContract.json"
import web3 from "web3";
import { mongoUrl } from './schema/const';
import { connect } from 'mongoose';

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

const patient_router = require("./router/patient.router")
const doctor_router = require("./router/doctor.router");
const record_router = require("./router/record.router");
const user_router = require("./router/user.router");

app.use('/patient', patient_router);
app.use('/doctor', doctor_router);
app.use('/record', record_router);
app.use('/user', user_router);


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
