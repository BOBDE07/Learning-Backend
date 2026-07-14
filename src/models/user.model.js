import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

// const app = express()
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar: {
        type: String,   // cloudinary url ka use krenge 
        required: true,
    },
    coverImage: {
        type: String,   // cloudinary url ka use krenge 

    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    refreshToken: {
        type: String,

    }

}, { timestamps: true })



userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return ;
        // return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    // next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

    )

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,

    },
        process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}



export const User = mongoose.model("User", userSchema)