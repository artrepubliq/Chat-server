// const awsUplaod = require('../../Middlewares/AWSUpload');
const uploadFileRouter = require('express').Router();
const fs = require('fs');
const path = require('path');

const uploadFileController = (req, res)=> {
    if(res){
        console.log("Request goes here.....")
        const result = JSON.stringify(req.files);
        // console.log(result);
        res.send(result);
    }
    else{ 
        console.log("Error occurred");
    }
}

module.exports = { uploadFileController }