req.get - https://www.geeksforgeeks.org/express-js-req-get-function/
res.clearCookie

------------

Promise `.tap`
like .then(), except that the value passed in is the value returned.
http://bluebirdjs.com/docs/api/tap.html

------------

Start a promise chain from a synchronously produced value:
```
Promise.resolve(<value>)
  .then()
```

------------

createSession at beginning of each request
  Check for hash in cookie
    No hash
      Create new session
      Set session to cookie
    Hash
      Get hash from cookie
      Get session from hash
        No session
          Create new cookie
      Set req.session

------------

Signup
  Get username/password from request body
  Check if username taken
    If taken, throw error
    If not taken, update session with userId <--
  Redirect to homepage
  Errors
    Send status
  Catch
    redirect to signup

------------

Login
  Get username/password from request body
  If username NOT taken or incorrect password
    Throw error
  Else
    Update session with userId <--
  Redirect to homepage
  Errors
    Send status
  Catch
    redirect to login

------------

logout
  Delete session
  Clear cookie
  redirect to login

Add logout link to index

------------

Auth.verifySession (Middleware for protected routes: /, /create, /links)
  If not logged in
    redirect to login
  Else
    Next