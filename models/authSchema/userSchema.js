import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({
    photoURL: {
        url: {
            type: String,
        },
        publicID: {
            type: String,
        },
    },
    displayName:{
        type:String,
        required:true,
        trim:true,
    },
    userName:{
        type:String,
        required:true,
        unique:true,
    },
    email: {
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type:String,
        required:true,
        select:false
    },
    college: {
        type:String,
        required:true,
        trim:true,
        minlength:[2,'College name must be at least 2 characters'],
        maxlength:[100,'College name must not exceed 100 characters']
    },
    department: {
        type:String,
        required:true,
        
    },
    academicYear: {
        type:Number,
        required:true
    }
});
// Email lookup (login, password reset)
userSchema.index({ email: 1 });

// Username lookup (login, profile views)
userSchema.index({ userName: 1 });

// Display name search (partial match queries)
userSchema.index({ displayName: 1 });

// College-based user search
userSchema.index({ college: 1, department: 1, academicYear: 1 });

// Text search for user search feature
userSchema.index({
  userName: 'text',
  displayName: 'text',
  email: 'text'
}, {
  weights: {
    userName: 10,      
    displayName: 5,    
    email: 1
  },
  name: 'user_text_search'
});
const userModel=mongoose.model("User",userSchema)
export default userModel;
