var express = require('express');
var router = express.Router();

router.get('/auth/login', function(req, res, next) {
    console.log(req.params.session_id + ', ' + req.params.session_key);
    res.json('{"test":"one"}');
});

module.exports = router;
