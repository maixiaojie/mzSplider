var http = require('http');
var fs = require('fs');
var readLine = require('lei-stream').readLine;

var download = {
	get: function(url) {
		var fileArray = url.split('/');
		var fileName = fileArray[fileArray.length-1];
		var req =http.get(url,function (res){
		   var imgData ="";
		   res.setEncoding("binary");//一定要设置response的编码为binary
		   console.log(`正在下载 ${fileName} 中...`);
		   res.on("data",function(chunk) {
		      imgData += chunk;
		   });
		   res.on("end",function() {
		   		console.log(`${fileName}下载成功`);
		      	fs.writeFile(`./video/${fileName}`,imgData,"binary",function(err) {
		         	if(err) {
		     	    	console.log(`${fileName}保存失败`);
		            	return;
		         	}
		         	console.log(`${fileName}保存成功`);
		         	imgData ="";
		      	});
		   });
		   res.on("error",function(err) {
		      console.log(`${fileName}下载失败`);
		   });
		});
	},
	task: function(url) {
		var req = http.request(url, download.getCallback(url));
		req.on('error', function(err) {
			console.log('当前下载任务出错了');
			console.error(err);
		});
		req.on('end', function() {
			console.log('当前下载任务完成');
		})
	},
	getCallback: function(url) {
		var fileArray = url.split('/');
		var fileName = fileArray[fileArray.length-1];
		var callback = function(res) {
			var fileBuff = [];
			// res.setEncoding("binary");//一定要设置response的编码为binary
			console.log(`正在下载 ${fileName} 中...`);
			res.on("data",function(chunk) {
			    var buffer = new Buffer(chunk);
        		fileBuff.push(buffer);
			});
			res.on("end",function() {
				console.log(`${fileName}下载成功`);
				var totalBuff = Buffer.concat(fileBuff);      
        		fs.appendFile(dirName + "/" + fileName, totalBuff, function(err){
        			if(err) {
			  	    	console.log(`${fileName}保存失败`);
			         	return;
			      	}
			      	console.log(`${fileName}保存成功`);
        		});
			});
			res.on("error",function(err) {
			   console.log(`${fileName}下载失败`);
			});
		}
		return callback;
	}
}
var controller = {
	downloadAll: function(fileName) {
		// readLineStream第一个参数为ReadStream实例，也可以为文件名
		var strData = '';
		const s = readLine(fs.createReadStream(fileName), {
		  // 换行符，默认\n
		  newline: '\n',
		  // 是否自动读取下一行，默认false
		  autoNext: false,
		  // 编码器，可以为函数或字符串（内置编码器：json，base64），默认null
		  encoding: function (data) {
		    // return JSON.parse(data);
		    return data;
		  }
		});
		// 读取到一行数据时触发data事件
		s.on('data', (data) => {
		  // console.log(data);
		  strData += data;
		  s.next();
		});
		// 流结束时触发end事件
		s.on('end', () => {
			var dataObj = JSON.parse(strData);
			var i=0, len = dataObj.length;
			for(i; i<len; i++) {
				var url = dataObj[i].video_url;
				var fileArray = url.split('/');
				var fileName = fileArray[fileArray.length-1];
				fs.exists(`./video/${fileName}`, function(exists) {
					if(exists) {
						console.log(`${fileName}已经存在`)
					}else {
						download.task(url);
					}
				})
			}
		});
		// 读取时出错
		s.on('error', (err) => {
		  console.error(err);
		});
	}
}

controller.downloadAll('video0.json');
