const express = require('express')
const app = express()
const path = require('path')

app.listen(8000, function(){
    console.log('listening on 8000')
})

app.use(express.static(path.join(__dirname, 'web_react/build')));

app.get('/', function(req,res){
    res.sendFile(path.join(__dirname, 'web_react/build/index.html'));
})





app.get('*', function(req,res){
    res.sendfile(path.join(__dirname, 'web_react/build/index.html'));
})