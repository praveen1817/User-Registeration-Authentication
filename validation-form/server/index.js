import express from 'express'
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors'
import authRouters from './routes/authRoutes.js'

const app=express()
app.use(cors())
app.use(express.json())
app.use('/auth',authRouters)

const port =process.env.PORT ? process.env.PORT : 3000
 

app.listen(port,()=>{
    console.log("Server is Running on :"+port);
})