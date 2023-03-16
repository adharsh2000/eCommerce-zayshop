const express = require('express')
const app = express()
const cookieParser = require('cookie-parser');
const cors = require('cors')
const session = require('express-session')
const nocache = require('nocache');
const adminRouter = require('./routes/adminRouter');
const userRouter = require('./routes/userRouter');
const errorHandler = require('./middleware/errorHandler')
const Noty = require('noty')
require('dotenv').config();
const PORT = process.env.PORT
const flash = require('connect-flash');
require('./config/connection').connect()


  const config = require('./config/config')
  const oneDay = 60*60*24*1000;
  
  app.use(nocache());
  app.use(cookieParser());
  app.use(flash());
  app.use(cors());
  
  app.use(
    session({
      secret: config.sessionSecret,
      saveUninitialized: true,
      cookie: { oneDay },
      resave: false,
    }),
  );

app.set('view engine', 'ejs');

//serving static files
app.use('/', express.static('public'))
app.use('/', express.static('public/assets'))
app.use('/admin', express.static('public/admin'))


app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use('/admin', adminRouter);
app.use('/', userRouter);
app.use(errorHandler);
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});


app.listen(PORT, function(){
  console.log(`SERVER RUNNING AT PORT:${PORT}`)
})
