const mongo=require('mongoose');

const userSchema=new mongo.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    
    phone:{
        type:String,
        required:true,
        unique:true

    },
    dept:{type:String,required:true},
    year:{type:Number,required:true},
   marks:{
    type:Number,
    default:0
   },
   q_attended:{
    type:Number,
    default:0
   },
   role:{
    type:String,
    enum:['student','admin'],
    default:'student'
   },
   attempt:{
    type:Number,default:0,min:0,max:1
   },
   submitted_answers: [
        {
            qId: { type: mongo.Schema.Types.ObjectId, ref: 'Question' },
            selected: String
        }
    ],
   isApproved: {
        type: Boolean,
        default: false // New users must be approved
    },
    marks_general: { type: Number, default: 0 },
    marks_technical: { type: Number, default: 0 },
    warningCount: {
        type: Number,
        default: 0
    },
    isDisqualified: {
        type: Boolean,
        default: false
    },
   eventId: {
    type: mongo.Schema.Types.ObjectId,
    ref: 'Events'}
});

const User=mongo.model('User',userSchema);

module.exports=User;    