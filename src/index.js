// require('dotenv').config({path: './env'})
import dotenv from "dotenv"

// import mongoose from "mongoose";
// import {DB_NAME} from "./constants.js"

import connectDB from "./db/index.js";
// import app from "app.js"
dotenv.config({
    path: './env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`sever is running ar Port: ${process.env.PORT}`);

        })

        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error
        })
    })
    .catch((err) => {
        console.log("MONGO_DB Connection Failed!", err);

    })


/*
//  approach 1
import express from "express"
const app = express()

(async () => {
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error" , (error) => {
            console.log("Error: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);

        })
    }
    catch(error) {
        console.log("error :" , error);
        throw error

    }
}) ()*/


// function connectDB() {
//
// }
// connectDB()