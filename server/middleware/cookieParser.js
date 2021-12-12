const parseCookies = (req, res, next) => {
  // check if cookie exists
  if (!req.headers.cookie) {
    req.cookies = {};
    next();
  } else {
    console.log('cookie header:', req.headers.cookie);
    // access the cookies on an incoming request
    let cookie = {};
    let cookieList = req.headers.cookie.split('; ');

    // parse them into an object
    for (let i = 0; i < cookieList.length; i++) {
      pair = cookieList[i].split('=');
      cookie[pair[0]] = pair[1];
    }

    // assign this object to a cookies property on the request.
    req.cookies = cookie;
    next();
  }
};

module.exports = parseCookies;