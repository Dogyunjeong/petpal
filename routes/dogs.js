var express = require('express');
var router = express.Router();
var multer = require('multer');
var dummy = require('../models/dummy');

var upload = multer({ dest: null});

router.post('/', upload.single('dog_profile_img'), function(req, res, next) {
   var resultMsg = "반려견 정보 등록을 성공했습니다.";
   var errMsg = "반려견 정보 등록을 실패했습니다.";

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
   reqData[0] = ["dog_profile_img", req.file, "file", 0];
   reqData[1] = ["dog_name ", req.body.dog_name, "string", 1];
   reqData[2] = ["dog_gender", req.body.dog_gender, "number", 1];
   reqData[3] = ["dog_age ", req.body.dog_age, "number", 1];
   reqData[4] = ["dog_type  ", req.body.dog_type  , "string", 0];
   reqData[5] = ["dog_weight  ", req.body.dog_weight , "number", 0];
   reqData[6] = ["dog_neutralized", req.body.dog_neutralized, "number", 1];
   reqData[7] = ["dog_characters  ", req.body.dog_characters , "string", 0];
   reqData[8] = ["dog_significant   ", req.body.dog_significant   , "string", 0];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.put('/:dog_name', upload.single('dog_profile_img'), function(req, res, next) {
   var resultMsg = "반려견 정보 등록을 성공했습니다.";
   var errMsg = "반려견 정보 등록을 실패했습니다.";


   var reqData = [];
   reqData[0] = [":dog_name", req.params.dog_name, "string", 1];
   reqData[1] = ["dog_profile_img", req.file, "file", 0];
   reqData[2] = ["dog_name ", req.body.dog_name, "string", 0];
   reqData[3] = ["dog_gender", req.body.dog_gender, "number", 0];
   reqData[4] = ["dog_age ", req.body.dog_age, "number", 0];
   reqData[5] = ["dog_type  ", req.body.dog_type  , "string", 0];
   reqData[6] = ["dog_weight  ", req.body.dog_weight , "number", 0];
   reqData[7] = ["dog_neutralized", req.body.dog_neutralized, "number", 0];
   reqData[8] = ["dog_characters  ", req.body.dog_characters , "string", 0];
   reqData[9] = ["dog_significant   ", req.body.dog_significant   , "string", 0];

   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/mine', function(req, res, next) {
   res.json({
      result: {
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }
   })
});

router.get('/:user_id', function(req, res, next) {
   var resultMsg = {
      data:[{
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }, {second: "...."}]
   };
   var errMsg = "반려견의 프로필을 볼러오는데 실패했습니다.";


   var reqData = [];
   reqData[0] = [":user_id ", req.params.user_id, "number", 1];


   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.get('/:user_id/dog/:dog_name', function(req, res, next) {
   var resultMsg = {
      data:[{
         user_id: 1,
         dog_profile_img_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZT-cF-FD1em9qpd-DcMYDIJmjs53H2BFHBLFok5H9duAazkj594z1rS8",
         dog_name: "말라",
         dog_age: 9,
         dog_type: "믹스 대형견",
         dog_weight: 2,
         dog_neutralized: 1,
         dog_characters: "사람을 잘따릅니다.",
         dog_significants: "건강하나 힘이 너무 좋습니다."

      }, {second: "...."}]
   };
   var errMsg = "반려견의 프로필을 볼러오는데 실패했습니다.";


   var reqData = [];
   reqData[0] = [":user_id ", req.params.user_id, "number", 1];
   reqData[1] = [":dog_name ", req.params.dog_name, "string", 1];


   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

router.delete('/:dog_name', function(req, res, next) {
   var resultMsg = "회원 정보 삭제에 성공했습니다.";
   var errMsg = "회원 정보 삭제에 실패했습니다.";


   var reqData = [];
   reqData[0] = [":dog_name ", req.params.dog_name, "string", 0];


   dummy(reqData, function (err, result) {
      if (err)
         next(err);
      if (result.errFlag > 0) {
         err = new Error(errMsg);
         err.stack = result;
         next(err);
      } else {
         res.json({
            result: resultMsg,
            sentData: result.data
         });
      }
   });
});

module.exports = router;

