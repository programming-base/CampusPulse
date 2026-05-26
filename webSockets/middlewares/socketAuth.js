
import jwt from 'jsonwebtoken';
import userModel from '../../database/schema/authSchema/userSchema.js';

export default async function  socketAuth(req){
    try{
        const url=new URL(
            req.url,
            'http://localhost'
        )
        const token=url.searchParams.get('token');
        const user=jwt.verify(token,process.env.JWT_ACCESS)
        const dbUser = await userModel.findById(user.userId,{password:0});
        if(!dbUser) return null;
        return dbUser;
    }catch(error){
        if(error.name===`TokenExpiredError`||error.name===`JsonWebTokenError`){
            return null;
        }
        return null;
    }
}