import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken() 
        const refreshToken = user.generateRefreshToken() 

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSafe: false })

        return { accessToken , refreshToken }
    } catch (error) {
        throw new ApiError(500 , "something went wrong while generating refresh and access token")
    }
}

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

    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }

    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // req.body - sara data req. data mei aata hai 
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })


    // user create hua hai ki nhi 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, " something went wrong while register the user ")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


const loggedInUser = asyncHandler(async (req , res) => {
    // req body se data le aao 
    // username or email 
    // find the user 
    // password check 
    // access and refresh token
    // send cookie

    const { userName, email , password } = req.body

    if(!(userName || email) ) {
        throw new ApiError(400 , "username or email is required") 
    }

    if(!password) {
        throw new ApiError(401, "password is required")
    }

    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })
    // $or mongodb mei use hota hai

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credential")
    }

    const { accessToken , refreshToken } =await generateAccessAndRefreshTokens(user._id)

    const logedInUser = await User.findById(user._id).select(" -password -refreshToken ")


    const options = {
        httpOnly: true , 
        secure:true ,
        
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , refreshToken , options) 
    .json(
        new ApiResponse(
            200, {
                user: logedInUser , accessToken , 
                refreshToken 
            }, 
            "user Loged in successfully"
        )
    )
})


const logOutUser = asyncHandler (async (req , res) => {
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true 
        }

    )
    // req.user._id

    const options = {
        httpOnly: true , 
        secure:true ,
        
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "user logged out"))
})

export { registerUser , loggedInUser , logOutUser }

