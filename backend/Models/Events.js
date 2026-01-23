const mongo=require('mongoose');

const eventSchema=new mongo.Schema({
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    time:{
        type:String,
        required:true
    },
    students_count:{
        type:Number,
        default:0
    },
    no_of_dept:{
        type:Number,
        default:0
    },
    rating:{
        type:Number,
        default:0
    },
    topStudents:{
        type:[String],
        default:[]
    }
    
});

const Event=mongo.model('Event',eventSchema);
module.exports=Event;
 