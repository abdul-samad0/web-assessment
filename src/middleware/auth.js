const auth = {
  isAuthenticated: (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
    req.flash('error', 'Please login to access this page');
    res.redirect('/auth/login');
  },

  setLocals: (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
  }
};

module.exports = auth;