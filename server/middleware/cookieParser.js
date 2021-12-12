const parseCookies = (req, res, next) => {
  var cookieList = req.headers.cookie || null;
  if (cookieList) {
    let cookies = cookieList.split('; ');
    let cookieObjects = [];
    for (let i = 0; i < cookies.length; i++) {
      let keyValue = cookies[i].split('=');
      cookieObjects.push({
        name: keyValue[0],
        hash: keyValue[1]
      });
    }
    req.cookies = cookieObjects;
  } else {
    req.cookies = null;
  }
  next();
};

module.exports = parseCookies;