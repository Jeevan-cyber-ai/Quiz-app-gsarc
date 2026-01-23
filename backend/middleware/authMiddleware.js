const jwt=require('jsonwebtoken');
const authMiddleware=async(req,res,next)=>{
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // --- PROXY DETECTION ---
    const isProxy = req.headers['via'] || req.headers['proxy-connection'] || req.headers['x-forwarded-proto'];
    if (isProxy) {
        logger.warn({
            event: "PROXY_DETECTED",
            ip: userIp,
            path: req.originalUrl,
            userAgent: userAgent,
            headers: req.headers
        });
    }
    console.log(req.headers);
    console.log(req.headers.authorization);
    const token=req.headers.authorization?.split(" ")[1];

    if(!token){
        logger.info({ event: "UNAUTHORIZED_ACCESS", ip: userIp, path: req.originalUrl });
        return res.status(401).json({message:"No token provided"});
    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();

    }
    catch(err){
        
        logger.error({ event: "INVALID_TOKEN_ATTEMPT", ip: userIp, error: err.message });
        return res.status(401).json({message:"Invalid token"});
    }

};


module.exports=authMiddleware;