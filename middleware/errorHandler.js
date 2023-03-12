// error handler 

const errorHandler = (err,req,res,next) => {
    if(err){
        res.render('user/404')
        console.log(err);
    }
}

module.exports = errorHandler;