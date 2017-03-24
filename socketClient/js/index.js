var socket
$(function() {
	//连接服务
	//				var socket = io("ws://sdjk.yanlongli.com:3000");
	socket = io("ws://localhost:3000");
	//页面加载的时候随机生成一个用户名
	var username = "user" + Math.floor(Math.random() * 1000);
	var mobile = Math.floor(Math.random() * 10000000000);
	var myInfo = {};
	myInfo.username = prompt("请给自己起一个昵称");
	myInfo.mobile = mobile;
	myInfo.userId = mobile;

	//连接成功
	socket.on('connect', function() {
		//注册用户名
		socket.emit('join', myInfo);

	});
	socket.on('system', function(res) {
		console.log(res)
		if(res.code == 'join') {
			//如果用户编号已注册
			//			console.log($("#selectList .Room" + res.user.userId).length<=0);
			if($("#selectList .Room" + res.user.userId).length <= 0 && res.user.userId != myInfo.userId) {
				$("#selectListTemp .badge").html("");
				$("#selectListTemp .selectListName").html(res.user.username);
				var selectList = $("#selectListTemp").children().attr("id", "Room" + res.user.userId).addClass("Room" + res.user.userId).clone(true);
				$("#selectListTemp").children().removeClass("Room" + res.user.userId)
				$('#selectList').append(selectList);
			}

			$('.chatMessage').append($("<li class='systemInfo_join'>").text("欢迎用户    " + res.user.username + "  加入聊天室"));

		} else if(res.code == 'exit') {

			$('.chatMessage').append($("<li class='systemInfo_exit'>").text("欢送用户    " + res.user.username + "  退出聊天室"));
		}
		if(res.code == "receipt") {
			if(res.status == false) {
				$("." + res.msgId).html("发送失败！对方可能已下线。").addClass("alert alert-warning");
				return;
			}
			$("." + res.msgId).addClass("hide");
			//						console.log(res.msgId+"发送成功");
		}
		if(res.code == "userList") {
			for(var i = 0; i < res.userList.length; i++) {
				if(!$("#selectList .Room" + res.userList[i].userId).length <= 0) continue;
				$("#selectListTemp .badge").html("");
				$("#selectListTemp .selectListName").html(res.userList[i].username);
				var selectList = $("#selectListTemp").children().attr("id", "Room" + res.userList[i].userId).addClass("Room" + res.userList[i].userId).clone(true);
				$('#selectList').append(selectList);

				$("#selectListTemp").children().removeClass("Room" + res.userList[i].userId)
			}
		}
		//让滚动条保持在底部
		//					$(".RoomPublic .chatMessageBox")[0].scrollTop = $(".chatMessageBox")[0].scrollHeight;
		//					$('#userTotal').html("当前在线人数" + res.userTotal + "人");
	});
	socket.on('public', function(res) {
		console.log(res)
		if(res.code == 'msg') {
			if(!$("#selectList .RoomPublic").hasClass("selectListActive")) {
				$("#selectList .RoomPublic .badge").html(parseInt($("#selectList .RoomPublic .badge").html()) ? parseInt($("#selectList .RoomPublic .badge").html()) + 1 : 1);
			}
			$("#temp li div .username").html(res.from.username);
			$("#temp li div .msg").html(res.msg);
			var temp = $("#temp").children().clone();
			$('.RoomPublic .chatMessage').append(temp);
		}

		$(".RoomPublic .chatMessageBox")[0].scrollTop = $(".RoomPublic .chatMessageBox")[0].scrollHeight;

	});
	socket.on('private', function(res) {
		console.log(res)
		if(res.code == 'msg') {
			//创建窗体
			chatRoomTempClone("Room" + res.from.userId, false);
			if(!$("#selectList .Room" + res.from.userId).hasClass("selectListActive")) {
				$("#selectList .Room" + res.from.userId + " .badge").html(parseInt($("#selectList .Room" + res.from.userId + " .badge").html()) ? parseInt($("#selectList .Room" + res.from.userId + " .badge").html()) + 1 : 1);
			}

			$("#temp li div .username").html(res.from.username);
			$("#temp li div .msg").html(res.msg);
			var temp = $("#temp").children().clone();
			$(".Room" + res.from.userId + ' .chatMessage').append(temp);
		}

		$(".Room" + res.from.userId + " .chatMessageBox")[0].scrollTop = $(".Room" + res.from.userId + " .chatMessageBox")[0].scrollHeight;

	});

	$(".send").click(function() {
		emit($(this).prev()[0].id);
		//					this.offsetParent().children(".chatMessageInput").attr("id");
	})
	$(".chatList .list-group .list-group-item").click(function() {
		//		alert(1)
		$(".chatList .list-group .list-group-item").removeClass("selectListActive");
		$(".chatList .list-group .RoomPublic").addClass("selectListActive");
		console.log($(".chatList .list-group .RoomPublic .badge").html(""));

		//克隆聊天窗体

		chatRoomTempClone(this.id, true);

	})
	$("#selectListTemp .list-group-item").click(function(e) {

		$(".chatList .list-group .list-group-item").removeClass("selectListActive");
		$(".chatList .list-group ." + this.id).addClass("selectListActive");
		console.log($(".chatList .list-group ." + this.id + " .badge").html(""));

		//克隆聊天窗体

		chatRoomTempClone(this.id, true);

	})

});

function emit(id) {

	var toUser = id;
	toUser = toUser.replace(/^txtRoom/, "")

	//生成唯一消息ID
	var msgId = "msgId" + new Date().getTime() + Math.floor(Math.random() * 100000);
	//发送的消息
	var msg = $("#" + id).val();
	if(msg.length < 1) {
		return;
	}
	//克隆模板
	$("#MyMessageTemp li  .MyMessage").html(msg)
	$("#MyMessageTemp li  .MyMessageStatus").html("正在发送").addClass(msgId)
	var temp = $("#MyMessageTemp").children().clone();
	$("#MyMessageTemp li  .MyMessageStatus").html("成功").removeClass(msgId)
	$('.Room' + toUser + ' .chatMessage').append(temp);

	if(toUser == "Public") {
		socket.emit('public', { 'msg': msg, 'msgId': msgId });
	} else {
		socket.emit('private', { 'toUser': toUser, 'msg': msg, 'msgId': msgId });
	}
	$("#" + id).val('');
	$(".Room" + toUser + " .chatMessageBox")[0].scrollTop = $(".Room" + toUser + " .chatMessageBox")[0].scrollHeight;
	return false;
};

//克隆聊天窗体
function chatRoomTempClone(id, show) {
	if($(".chatRoomBox .chatRoomList ." + id).length < 1) {
		$("#chatRoomTemp .chatRoom").addClass(id);
		$("#chatRoomTemp .chatRoom .chatMessageInputBox .chatMessageInput").attr("id", "txt" + id);
		$("#chatRoomTemp .chatRoom .title").html($("#" + id + " .selectListName").html());

//		$(".chatRoomBox .chatRoomList .chatRoom").addClass("hide");

		var room = $("#chatRoomTemp").children().clone(true);
		$("#chatRoomTemp .chatRoom").removeClass(id);
		$(".chatRoomBox .chatRoomList").append(room);
	}
	if(show) {
		$(".chatRoomBox .chatRoomList .chatRoom").addClass("hide");
		$(".chatRoomBox .chatRoomList ." + id).removeClass("hide");
	}
}