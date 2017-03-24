var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//app.get('/', function(req, res) {
//	res.sendfile('<h1>欢迎查看聊天室</h1>');
//});

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

//统计人数
var userTotal = 0;
var MultiClient = true;

//储存所有用户数据
var userDb = [];
io.on('connection', function(socket) {
	console.log('一个用户连接:' + socket.id);
	//用户加入推送姓名后
	socket.on('join', function(res) {
		//给自己获取所有用户信息
		//储存在线用户数据
		var users = [];

		for(var i = 0; i < userDb.length; i++) {
			if(userDb[i].status == 1 && userDb[i].userId != res.userId) users.unshift(userDb[i])
		}
		io.to(socket.id).emit('system', { 'code': 'userList', 'userList': users });
		//将用户储存在user对象中
		res.id = socket.id;
		res.status = 1; //标记为在线 1 在线 2离线 

		var isSave = false; //判断是否存在
		if(!MultiClient) {

			for(var i = 0; i < userDb.length; i++) {
				if(userDb[i].userId == res.userId) {
					userDb[i] = res
					isSave = true;
				}
			}

		}
		//新用户加入
		if(!isSave) {
			userDb.unshift(res);
		}

		//给除了自己以外的所有用户推送（前台判断，如何和自己的id相同提示在另一地点登录，所有输入框禁用）
		socket.broadcast.emit('system', { 'code': 'join', 'user': res });
		console.log('用户' + res.username + "登录、用户编号是：" + res.userId);
	});

	socket.on('disconnect', function() {
		var user = [];
		for(var i = 0; i < userDb.length; i++) {
			if(userDb[i].id == socket.id) {
				userDb[i].status = 2;
				user.unshift(userDb[i]);
			}
		}
		if(user.length < 2)
			socket.broadcast.emit('system', { 'code': 'exit', 'user': user[0] });
		console.log('用户退出' + socket.id);
	});

	//公共聊天室
	socket.on('public', function(res) {
		var thisUser; //发送方信息
		var toUser //接收方信息

		//发送方信息
		for(var i = 0; i < userDb.length; i++) {
			if(userDb[i].id == socket.id) {
				thisUser = userDb[i];
				break;
			}
		}
		socket.broadcast.emit('public', { 'code': 'msg', 'from': thisUser, 'msg': res.msg });
		io.to(socket.id).emit('system', { 'code': 'receipt', 'msgId': res.msgId });
		console.log(thisUser.username + " 说：" + res.msg)
	});
	//私人聊天
	socket.on('private', function(res) {
		var thisUser = {}; //发送方信息
		var toUser = {}; //接收方信息

		//发送方信息
		for(var i = 0; i < userDb.length; i++) {
			if(userDb[i].id == socket.id) {
				thisUser = userDb[i];
				break;
			}
		}
		//接收方信息
		var isSend = false;
		for(var i = 0; i < userDb.length; i++) {
			if(userDb[i].userId == res.toUser) {
				toUser = userDb[i];
				//如果多端登录，并且在线则发送
				if(toUser.status == 1) {
					isSend = true; //任意一次发送成功都视为发送成功
					io.to(toUser.id).emit('private', { 'code': 'msg', 'from': thisUser, 'msg': res.msg });
					io.to(socket.id).emit('system', { 'code': 'receipt', 'msgId': res.msgId });
					console.log(thisUser.username + " 私聊" + toUser.username + "说：" + res.msg + "/发送成功")
				} else if(!MultiClient && toUser.status == 2) { //如果不允许多端登录（那就只会存一个userid）则返回发送失败
					break;
				}
			}
		}
		if(!isSend) {
			io.to(socket.id).emit('system', { 'code': 'receipt', 'msgId': res.msgId, 'status': false });
			console.log(thisUser.username + " 私聊" + toUser.username + "说：" + res.msg + "/发送失败")
		}

	});
	//	socket.on('group1', function(data) {
	//		socket.join('group1');
	//	});
	//	socket.on('group2', function(data) {
	//		socket.join('group2');
	//	});
});
var port = 3000;
http.listen(port, function() {
	console.log('开放端口：' + port);
});