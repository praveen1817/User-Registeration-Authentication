import express from 'express'
import {connectToDatabase} from '../lib/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router=express.Router();

router.post("/register", async (req,res)=>{
    console.log("register hit api");
    const {username,email,password}=req.body;
    console.log(username); 
    try{
        const db= await connectToDatabase();
        const [rows] = await db.query('select * from users where email = ?',[email]);
        if(rows.length>0){
            return res.status(409).json({message:"The user Already exists"})
        }
        const hashPassword=await bcrypt.hash(password,10)
        await db.query('insert into users (username,password,email) values (?,?,?)',
            [username,hashPassword,email])
            res.status(201).json({message:"User created Sucessfully"})
    }
    catch(err){
        console.log("Error:"+err);
        res.status(500).json({message:"Internal Server Error"})
    }
});

router.post("/login", async (req,res)=>{
    console.log("Login hit api");
    const {email,password}=req.body;
    try{
        const db= await connectToDatabase();
        const [rows] = await db.query('select * from users where email = ?',[email]);
        if(rows.length===0){
            return res.status(500).json({message:"No User Exist Try to SigIn First"})
        }
        const isMatch= await bcrypt.compare(password,rows[0].password);
        if(!isMatch){
            return res.status(401).json({message:"InCorrect Password"});
        }
        const token =jwt.sign({id:rows[0].id},process.env.JWT_KEY,{expiresIn:'2h'})
        res.status(201).json({token:token})
    }
    catch(err){
        console.log("Error:"+err);
        res.status(500).json({message:"Internal Server Error"})
    }
});

const verifyToken= async (req,res,next)=>{
    try{
        const authToken=req.headers.authorization;
        if(!authToken){
            return res.status(403).json({message:"No Token Provided"})
        }
        const token =authToken.split(" ")[1];
        const decoded=jwt.verify(token,process.env.JWT_KEY)
        req.userId=decoded.id;
        next()
    }
    catch(err){
        return res.status(401).json({message:"Invalid or expired Token"})
    }
}
router.get('/home',verifyToken, async(req,res)=>{
    try{
        const db= await connectToDatabase();
        const [rows] = await db.query('select * from users where id = ?',[req.userId]);
        if(rows.length===0){
            return res.status(500).json({message:"No User Exist Try to SigIn First"})
        }     
        return res.status(201).json({user:rows[0]})
    }
    catch(err){
        res.status(500).json({message:"Internal Server Error"})
    }
})


export default router;