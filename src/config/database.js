const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect('mongodb+srv://sumitme00117:Sumita!1234@cluster1.unuhvpe.mongodb.net/devTinder')
}


module.exports = connectDB;