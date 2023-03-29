require('dotenv').config()
const express =  require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./database_models/userModel");
const { validationResult, body} = require('express-validator');
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const salt = bcrypt.genSaltSync(10);
const multer  = require('multer');
const { storage } = require('./database_models/multer');
const upload = multer({storage});
const Post = require("./database_models/postModel");
const fs = require("fs")


mongoose.connect(`mongodb+srv://mern-blog:${process.env.MONGOPASSWORD}@cluster0.5cto3ns.mongodb.net/?retryWrites=true&w=majority`,{
    useUnifiedTopology:true,
    useNewUrlParser:true
}).then(console.log("Remotely connected to the database"))

const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(cors({credentials:true, origin:"https://lissaidev-community.onrender.com"}));
app.use("/uploads" , express.static(__dirname+"/uploads"))

app.post('/register',[
    body('username','Nome de usuário inválido. Tente novamente')
    .exists()
    .isLength({min:4})
    .custom(async(value) => {
        const user = await User.exists({username: value})
        if(user){
            throw new Error("Usuário já registrado!")
        }else{
            return true
        }
    }),
    body('password', 'Introduza uma senha mais segura')
    .isLength({min:5})

    
],(req,res)=>{
    const {username , password} = req.body
    if(validationResult(req).errors.length!==0){
        res.json({status:"bad" , errors: validationResult(req).errors})
    }else{
        try{
            const user = new User({
                username,
                password: bcrypt.hashSync(password, salt)
            })
            user.save().then(saved => console.log(saved))
            res.json({status: "ok", user:user})
        }catch(e){
            res.status(400).json(e)
        }
    }
    
})

app.post("/login",async (req,res)=>{
    const {username, password}= req.body
    const userDoc = await User.findOne({username})
    if(userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password)
        if(passOk){
            jwt.sign({username,id:userDoc._id},process.env.MONGOPASSWORD,{},(err,token)=>{
                if(err){
                    throw err
                }else{
                    res.cookie('token',token).json({
                        id: userDoc._id,
                        username
                    })
                }
            })
        }else{
            res.status(400).json("Wrong credentials")
        }
    }else{
        res.status(404).json(null)
    }
})

app.get("/profile",(req,res)=>{
    const {token}=req.cookies;
    if(token){
        jwt.verify(token, process.env.MONGOPASSWORD,{},(err,info)=>{
            if(err){
                throw err
            }else{
                res.json(info)
            }
        })
    }else{
        res.json(null)
    }
    
})

app.post("/logout",(req,res)=>{
    res.cookie("token","").json("Token destruido")
})

app.post("/createPost",upload.single('file'),(req,res)=>{
    const {token} = req.cookies
    if(token){
        jwt.verify(token, process.env.MONGOPASSWORD,{},(err,info)=>{
            if(!err){
                const { id: author} = info
                const { title, summary, content } = req.body;
                const { filename: file } = req.file
                const post = new Post({
                    title,
                    summary,
                    content,
                    file,
                    author
                })
                post.save().then((post) => console.log(post))
                res.status(200).json("ok")
                
            }else{
                res.status(400).json("bad")
            }
        })
    }else{
        res.status(400).json("bad")
    }

    
})

app.get("/post/:id",async (req,res)=>{
    const {id} = req.params
    const post = await Post.findById(id)
    if(post){
        res.status(200).json(post)
    }
})

app.get("/posts",async (req,res)=>{
    const posts = await Post.find().populate("author" , ["username"]).sort({'createdAt': -1}).limit(20)
    res.json(posts)
})

app.listen(process.env.PORT || 8080,()=>console.log("Server is up and running on port 8080"));
