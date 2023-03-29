const { default: mongoose, Schema, model } = require("mongoose")
const postSchema = new Schema({
    title: String,
    summary : String,
    content : String,
    file : String,
    author : {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
})

const Post = new model("Post", postSchema)

module.exports = Post