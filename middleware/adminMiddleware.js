

const isLogin = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.adminId){}
        else{
            res.redirect('/admin/')
        }
        next()
        
    } catch (error) {
        console.log(error.message);
    }
}
const isLogout = async(req,res,next)=>{
    try {
        adminSession = req.session
        if(adminSession.adminId){
            isAdminLoggedin = true
            res.redirect('/admin/')
        }
        next()

    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
    isLogin,
    isLogout
}