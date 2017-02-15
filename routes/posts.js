var express = require('express');
var router = express.Router();
var dummy = require('../models/dummy');
var multer = require('multer');

var upload = multer({ dest: null});

router.post('/', upload.single('image'), function(req, res, next) {
   var resultMsg = "게시글 작성에 성공하였습니다.";
   var errMsg = "게시글 작성에 실패하였습니다.";

   var imgCheck = {};
   if(req.file){
      if(req.file.mimetype) {
         imgCheck.image = req.file.originalname;
         imgCheck.type = req.file.mimetype;
      }
   } else {
      imgCheck.image = null;
      imgCheck.error = "이미지가 정상적으로 전달되지 않았습니다..";
   }

   var reqData = [];
   reqData[0] = ["image ", req.file, "file", 1];
   reqData[1] = ["content ", req.body.content, "string", 1];
   reqData[2] = ["lat", req.body.lat, "number", 1];
   reqData[3] = ["long ", req.body.long, "number", 1];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/lat/:lat/long/:long/p/:p', function(req, res, next) {

   var resultMsg = "성공하였습니다";
   var errMsg = "타임라인 목록을 가져오는데 실패하였습니다.";

   var reqData = [];
   reqData[0] = [":lat", req.params.lat, "number", 1];
   reqData[1] = [":long ", req.params.long, "number", 1];
   reqData[2] = [":p ", req.params.p, "number", 1];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/users/:user_id', function(req, res, next) {

   var resultMsg =  {
      page : 1,  //제시된 정보의 페이지 정보
      data : [
         {
            art_id : 123 ,
            image_url : "https://goo.gl/pkEex0"
         }, {
            art_id : 234 ,
            image_url : "https://goo.gl/pkEex0"
         }]
   };
   var errMsg = "개인 타임라인 목록을 가져오는데 실패하였습니다.";

   var reqData = [];
   reqData[0] = [":user_id", req.params.user_id, "number", 1];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/:art_id/details', function(req, res, next) {

   var resultMsg =  {
      data :
         {
            art_id : 123,
            user_id : 1,
            user_name : "홍길동",
            create_date : "2016-08-10 15:30:00",
            image_url : "https://goo.gl/pkEex0",
            content : "말라와의 산책~~~",
            num_like : 11
         }
   };
   var errMsg = "게시글 상세 정보를 가져오는데 실패하였습니다.";

   var reqData = [];
   reqData[0] = [":art_id", req.params.art_id, "number", 1];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         res.json({
            err: errMsg,
            sentData: result.data
         });
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

module.exports = router;