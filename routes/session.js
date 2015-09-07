var express = require('express');
var router = express.Router();

router.get('/auth/login', function(req, res, next) {
    console.log(req.query.session_id + ', ' + req.query.session_key);
    res.json('{"token":"df8932hd9"}');
});

module.exports = router;
