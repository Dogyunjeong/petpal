function isSecure(req, res, next) {
   if(req.secure)
      return next();
   var  err = new Error("Protocol Upgrade Required");
   err.status = 426;
   next(err);
}

function isLoggedIn(req, res, next) {
   if(req.user)
      return next();
   var  err = new Error("Login required");
   err.status = 401;
   next(err);
}

module.exports.isSecure = isSecure;
module.exports.isLoggedIn = isLoggedIn;