const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/iha_database", {
    //for deprication warning 
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("connection with database has created");
}).catch((error)=>{
    console.log("no connection ");
});