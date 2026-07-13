import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    // 1. get user details from frontend 
    // 2. validation (empty username , email, ) not empty 
    // 3. check if use already exist : username , email
    // 4. check for images , check for avatar
    // 5. uplaod them to cloudinary , check avatar uplload in cloudinary 
    // 6. create use object - create entry in db 
    // 7. remove password and refresh token feild from response 
    // 8. check for user creation 
    // 9. if user created then return response

    const { fullName, userName, email, password } = req.body
    // console.log("fullName: " , fullName);
    // if (fullName === "") {
    //     throw new ApiError(400, "fullName is required")
    // }

    if ([fullName, userName, email, password]
        .some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }

    const existedUser = User.findOne({
        $or: [{ userName } , { email }]
    })

    if(existedUser) {
        throw new ApiError(409 , "user with email or username already exists")
    }

    // req.body - sara data req. data mei aata hai 
    const avatarLocalPath = req.files?.avatar[0]?.path ;
    const coverImageLocalPath = req.files?.coverImage[0]?.path ;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400 , "Avatar file is required")
    }

    const user = await User.create({
        fullName, 
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email , 
        password , 
        userName : userName.toLowerCase()
    })


    // user create hua hai ki nhi 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ) 

    if(!createdUser) {
        throw new ApiError(500 , " something went wrong while register the user ")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser, "User registered successfully")
    )
})

export { registerUser }

