const express = require('express');
const mysql = require('mysql');
const app = express();
const bodyParser = require('body-parser')
const path = require("path");
const port = 3000;
const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    database: 'todo_app'
});

// SQL文をまとめたクラス
class Querylist {
    // ユーザー関連
    all_users = 'SELECT * FROM users WHERE delete_flag = 0';
    insert_users = 'INSERT INTO users (name, password, delete_flag) VALUES (?, ?, 0)';
    remove_user = 'UPDATE users SET delete_flag = 1 WHERE id = ?';
    // タスク関連
    all_tasks = 'SELECT * FROM tasks'; 
    insert_tasks = 'INSERT INTO tasks (user_id, text) VALUES (?, ?)';
    delete_tasks = 'DELETE FROM tasks WHERE id = ?';
    count_task = 'SELECT COUNT(id) FROM tasks';
    // その他
    select_user_task = 'SELECT t.id, u.name, t.text FROM tasks AS t INNER JOIN users AS u ON t.user_id = u.id WHERE u.delete_flag = 0 ORDER BY t.id desc';
};
// インスタンス化
const query = new Querylist();

con.connect(function(err) {
  if (err) throw err;
    console.log('Connected');

    // pathを調べる方法
    // console.log('現在のファイルのパス', __filename);
    // console.log('現在のファイルの名前', path.basename(__filename));
    // console.log('現在のファイルのディレクトリ', __dirname);
});

// フロント処理
app.set('views', './views');
app.set('view engine', 'ejs');

//ミドルウェアの設定
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// viewsの設定------------------------------------------------------------
// indexページの処理
app.get('/', (req, res) => {
    console.log("ページ遷移しました。");
    con.query(query.select_user_task, function (err, result) {
        if (err) throw err;
        // 配列が空か判定
        if (result.length === 0) {
            console.log("データ無し");
        } else {
            console.log("データ有り");
        }
        // SELECTした結果(result)を変数tasksに代入
        res.render('index', { user_tasks: result });
        console.log("データがindexに渡されました");
    });
});
// ブラウザから受け取った値を元に削除する
app.get('/delete/:id', (req, res) => {
    con.query(
        query.delete_tasks,
        [req.params.id],
        function (err, result) {
            if (err) throw err;
            console.log(result);
            res.redirect('/');
        }
    );
});

// formページの設定
// ユーザー表示用の処理
app.get('/form', (req, res) => {
    console.log("ページ遷移しました。");
    con.query(query.all_users, function (err, result) {
        if (err) throw err;  
        res.render('form', { users: result });
        console.log("データがformに渡されました");
    });
});
// INSERT処理
app.post('/form', (req, res) => {
    // ブラウザのformタグから値を取得し、変数に代入
    let user_id = Number(req.body.user);
    let text = req.body.txt;

    con.query(
        query.insert_tasks,
        [user_id, text],
        (err, result) => {
            if (err) throw err;
            let insert_num = result.insertID;
            console.log(insert_num);
            res.redirect('/');
        }
    );
});

// signupページの設定
app.get('/signup', (req, res) => {
    res.render('signup');
});
app.post('/signup', (req, res) => {
    // ブラウザのformタグから値を取得し、変数に代入
    let name = req.body.user_name;
    let password = req.body.pass;

    con.query(
        query.insert_users,
        [name, password],
        (err, result) => {
            if (err) throw err;
            let insert_num = result.insertID;
            console.log(insert_num);
            res.redirect('confirmation');
        }
    );
});

// confirmation
app.get('/confirmation', (req, res) => {
    con.query(
        // 最新のuserを1件取得
        'SELECT * FROM users ORDER BY id desc LIMIT 1',
        function (err, result) {
            if (err) throw err;
            res.render('confirmation', { user: result });
        }
    );
});

// management
app.get('/management', (req, res) => {
    con.query(
        query.all_users,
        function (err, result) {
            if (err) throw err;
            res.render('management', { users: result });
        }
    );
});
app.get('/removeUser/:id', (req, res) => {
    con.query(
        query.remove_user,
        [req.params.id],
        function (err, result) {
            if (err) throw err;
            console.log(result);
            res.redirect('/management');
        }
    )
});

// ------------------------------------------------------------

app.listen(port);