var koa = require('koa');
var views = require('koa-views');
var jade = require('jade');
var router = require('koa-router');
var body = require('koa-body-parser');
var koaPg = require('koa-pg')
var settings = require('./settings.js');

var wrap = function(rows, type) {
  var array = [];
  rows.forEach(function(row) {
    var wrappedRow = {
                       type: type,
                       row: row
                     }
    array.push(wrappedRow);    
  });
  return array;
};

var app = koa();

app.use(require('koa-static')('static'));
app.use(body());
app.use(koaPg(settings.pg_connection));
app.use(views('views', {
  default: 'jade'
}));
app.use(router(app));
 
app.get('/show/:post_id', function *(next) {
  var question = yield this.pg.db.client.query_('SELECT owner_user_id, title, body, creation_date FROM posts WHERE id = $1', [this.params.post_id]);
  var answers = yield this.pg.db.client.query_('SELECT owner_user_id, title, body, creation_date FROM posts WHERE parent_id = $1', [this.params.post_id]);
  var post_histories = yield this.pg.db.client.query_('SELECT user_id, post_history_type_id, text, comment, creation_date FROM post_history WHERE post_id = $1', [this.params.post_id]);
  var comments = yield this.pg.db.client.query_('SELECT user_id, text, creation_date FROM comments WHERE post_id = $1', [this.params.post_id]);
  var sorted = [];
  sorted = sorted.concat(wrap(question.rows, 'question'), wrap(answers.rows, 'answer'), wrap(post_histories.rows, 'post_history'), wrap(comments.rows, 'comment'))
  sorted.sort(function(a, b) {return new Date(a.row.creation_date) - new Date(b.row.creation_date) >= 0 ? 1 : -1;});
  yield this.render('show', {sorted: sorted});
});

app.listen(3000);
