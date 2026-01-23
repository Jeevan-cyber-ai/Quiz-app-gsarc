const mongo=require('mongoose');

const connectDB=async()=>{
    try{
    await mongo.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    }
    catch(err){
        console.log("Error in DB connection",err);
    }
}

module.exports=connectDB;