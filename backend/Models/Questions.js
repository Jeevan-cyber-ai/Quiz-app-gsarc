const mongo=require('mongoose');

const questionSchema=new mongo.Schema({
    questionText:{
        type:String,
        required:true}
    ,
    options:{
        type:[String],
        required:true
    },
    correctAnswer:{
        type:String,
        required:true
    },
    year:{
        type:Number,
        required:true
    },
    dept:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:['General Aptitude','Technical Aptitude'],
        default:'MCQ'
    },
    eventId: {
        type: mongo.Schema.Types.ObjectId,
        ref: 'Events', // Make sure this matches the name in your Events model file
        
    }
});
const Question=mongo.model('Question',questionSchema);
module.exports=Question;