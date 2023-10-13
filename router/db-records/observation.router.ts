import express, { Request, Response } from 'express';
import { Observation, requiredAttrs } from "../../schema/Observation.model";
import { Observation as IObservation } from 'fhir/r5';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const observations = await Observation.find();
        res.status(StatusCodes.OK).json({
            message: 'success',
            data: observations
        })
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})

router.get("/:id", async (req: Request, res: Response) => {
    try {
        const observation = await Observation.findOne({
            _id: req.params['id']
        })
        res.status(StatusCodes.OK).json({
            message: 'success',
            data: observation
        })
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})


router.post("/create", async (req: Request, res: Response) => {
    const body = req.body as IObservation;
    // for (let i = 0; i < requiredAttrs.length; i++) {
    //     if (!body[requiredAttrs[i]]) {
    //         return res.status(StatusCodes.BAD_REQUEST).json({
    //             message: 'error',
    //             error: `Parameter ${requiredAttrs[i]} does not exist in body!`
    //         })
    //     }
    // }

    try {
        const observation = await Observation.create(body);
        return res.status(StatusCodes.OK).json({
            message: "success",
            data: observation
        })
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: "error",
            error: err.toString()
        })
    }
})

module.exports = router;