import { DotenvConfigOutput } from "dotenv";

const dotenv = require("dotenv").config() as DotenvConfigOutput;
export const mongoUrl = `mongodb+srv://${dotenv.parsed.MONGO_DB_USERNAME}:${dotenv.parsed.MONGO_DB_PASSWORD}@mymedtrust.yoxnctq.mongodb.net/MyMedTrust?retryWrites=true&w=majority`;
