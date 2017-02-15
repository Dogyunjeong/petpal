var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
   res.json({
      result: {
         data:{
            use_term : "서비스 이용약관....",
            private_info_use_term: "개인정보 처리 방침....",
            private_info_3rd_term: "개인정보 제3자 동의.......",
            private_info_collect_term: "개인정보 수집 및 이용 동의......",
            geological_info_use_term: "위치기반 서비스 이용약관......."
         }
      }
   });
});

module.exports = router;

