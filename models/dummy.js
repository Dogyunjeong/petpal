/**
 * Created by T on 2017-02-13.
 */
var async = require('async');

function dummyCheck(reqData, callback) {
    var resObj = {};
    resObj.errFlag = 0;
    resObj.data = [];
    async.each(reqData, function(data, callback) {
       var obj = {};
       if (data[1]){
          if(data[2] === "file"){
             if(data[1].mimetype) {
                obj[data[0]] = data[1].originalname;
                obj.type = data[1].mimetype;
             } else {
                obj[data[0]] = null;
                obj.error = "이미지가 정상적으로 전달되지 않았습니다..";
             }
          }
          if (data[2] === "number"){
             if (isNaN(data[1]) === false){
                obj[data[0]]= data[1];
                obj.type = "number"
             } else {
                obj[data[0]]= data[1];
                obj.error = "이 항목은 반드시 number 타입이어야 합니다.";
                resObj.errFlag++
             }
          }
          if (data[2] === "string"){
             if (!isNaN[data[1]] && typeof(data[1]) === "string" ) {
                obj[data[0]]= data[1];
                obj.type = "string"
             } else {
                obj[data[0]]= data[1];
                obj.error = "이 항목은 반드시 String 타입이어야 합니다.";
                resObj.errFlag++
             }
          }
       } else {
          if (data[3] === 1) {
            obj[data[0]] = data[1] || null;
            obj["error"] = "필수 데이터가 입력되지 않았습니다.";
            resObj.errFlag++
          } else {
             obj[data[0]] = data[1] || null;
             obj["error"] = "선택 데이터가 입력되지 않았습니다.";


          }
       }

       resObj.data.push(obj);
       callback();

    }, function(err) {
       if (err)
           callback(err);
       callback(null, resObj);
    });
}

module.exports = dummyCheck;
