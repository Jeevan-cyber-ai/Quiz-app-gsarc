const studentOnly = (req, res, next) => {
    if(req.user && req.user.role === 'student'){
        next();
    }
    else{
        return res.status(403).json({message:"Access denied. Students only."});
    }

};
module.exports=studentOnly;