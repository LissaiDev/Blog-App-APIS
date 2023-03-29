const multer = require('multer')
const path = require("path")

// Multer config
const storage= multer.diskStorage({
    destination: (req, file, callback)=>{
        callback(null, path.resolve("uploads"));
    },
    filename: (req,file,callback)=>{
        const date = new Date().getTime()
        callback(null, `${Date.now()}_${file.originalname}`)
    }
})

module.exports = {storage}