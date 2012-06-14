var express = require('express'),
    app = express.createServer();
app.use(express["static"](__dirname+'/..'));
app.listen(process.env.C9_PORT || process.env.PORT || 7272);