var QueryFn = require('./queryFunction');
var schedule = require('node-schedule');

function exchangePoint() {
   let queries = {
      select: 'select reserve_id, stroll_user_id, reserve_user_id ' +
              'from reservations ' +
              'where to_time = date_format(now(), "%Y-%m-%d %h:00:00") and status = 2 ',
      updateStrollUser: {
         start: 'update users ' +
                'set points = points + 10 ' +
                'where user_id = ? ',
         queryParts: ' or user_id = 2 ',
         end: ''
      },
      updateReserveUser: {
         start: 'update users ' +
         'set points = points - 10 ' +
         'where user_id = ? ',
         queryParts: ' or user_id = 2 ',
         end: ''
      },
      updateReservations: {
         start: 'update reservations ' +
                'set status = if(status = 2, 4, status) ' +
                'where reserve_id = ? ',
         queryParts: ' or reserve_id = ? ',
         end: ''
      }
   };
   let params = {
      updateStrollUser: {
         start: [],
         paramParts: [],
         end: [],
      },
      updateReserveUser: {
         start: [],
         paramParts: [],
         end: [],
      },
      updateReservations: {
         start: [],
         paramParts: [],
         end: [],
      }
   }

}

var pointsExchange = schedule.scheduleJob('0 0  ? * *', exchangePoint);