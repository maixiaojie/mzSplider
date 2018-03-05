var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var readLine = require('lei-stream').readLine;
// 引入 events 模块
var events = require('events');
// 创建 eventEmitter 对象
var eventEmitter = new events.EventEmitter();

var splider = {
	main_url: 'http://m.maiziedu.com',
	base_url: 'http://m.maiziedu.com/course/',
	course: ['python', 'web', 'oam', 'op', 'pm', 'ios', 'android', 'php', 'qrsqd', 'iot', 'gd', 'ui', 'test'],
	/**
	 * [根据课程一级大分类获取该分类下所有的课程相关信息]
	 * @param  {[type]} course_type_name [分类名称]
	 * @return {[type]}  json            [该分类下的课程信息（课程id,课程名称,图片,学习时长）]
	 */
	getCourseList: function(course_type_name, callback) {
		var that = this, course_list = [], cbData = {};
		request(that.base_url+course_type_name, function(err, res, body) {
			if(err) return;
			var $ = cheerio.load(res.body);
			$('.syllabusList').each(function(index, ele) {
				$(ele).find('li').each(function(i, e) {
					course_list.push({
						id: $(e).find('a').attr('href').split('/')[2],
						course_name: $(e).find('strong').text(),
						course_type_name: course_type_name,
						img: that.main_url + $(e).find('.ui-imglazyload').attr('data-url'),
						learning_time: $(e).find('span').last().text()
					});
				});
			});
			cbData.course_type_name = course_type_name;
			cbData.course_list = course_list;
			callback(course_list);
		})
	},
	/**
	 * [根据课程id获取该课程下相关信息]
	 * @param  {[type]} course_id [课程id]
	 * @return {[type]}           [课程相关信息（课程介绍,课程课时列表，相关wiki）]
	 */
	getLessonList: function(course_id, callback) {
		var that = this,lessonData = {}, lessonList = [], wikiList = [];
		request(that.base_url+course_id, function(err, res, body) {
			if(err) return;
			var $ = cheerio.load(res.body);
			lessonData.course_introduce = $('.summary').find('.txt').text();
			$('.smallCourseCatalog').find('.list li').each(function(i, e) {
				lessonList.push({
					lesson_id: $(e).find('a').attr('href').split('/')[2],
					lesson_name: $(e).find('a').text().split('.')[1],
					lesson_time: $(e).find('a').text().split('.')[0],
				});
			});
			$('.smallWiKi').find('#wiki_lists li').each(function(i, e) {
				wikiList.push({
					title: $(e).find('h2').text(),
					content: $(e).find('p').text()
				});
			})
			lessonData.lessonList = lessonList;
			lessonData.wikiList = wikiList;
			callback(lessonData);
		})
	},
	/**
	 * [根据课程id或者视频地址]
	 * @param  {[type]}   lesson_id [课程id]
	 * @param  {Function} callback  [description]
	 * @return {[type]}             [description]
	 */
	getVideoUrl: function(lesson_id, callback) {
		var that = this, cbData = {};
		request(that.base_url+lesson_id, function(err, res, body){
			if(err) return;
			var $ = cheerio.load(res.body);
			cbData.video_url = $('video').attr('src');
			cbData.lesson_id = lesson_id;
			callback(cbData);
		});
	}
};

var controller = {
	/**
	 * [getAllCourse 获取所有课程]
	 * @return {[type]} [description]
	 */
	getAllCourse: function() {
		var courseData = [];
		var promise1 = splider.course.forEach(function(e, i) {
			splider.getCourseList(e, function(data) {
				courseData = courseData.concat(data)
				eventEmitter.emit('getcourse', function() {
				});
			});
		});
		eventEmitter.on('getcourse', function() {
			fs.writeFileSync('course.json', JSON.stringify(courseData));
		});
	},
	getAllLesson: function() {
		// readLineStream第一个参数为ReadStream实例，也可以为文件名
		var strData = '';
		const s = readLine(fs.createReadStream('./course.json'), {
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
			var rsArr = [];
			dataObj.forEach(function(e, i) {
				splider.getLessonList(e.id, function(data) {
					rsArr.push(data);
					eventEmitter.emit('getlesson', function() {
					});
					
				});
					
			});
			eventEmitter.on('getlesson', function() {
				fs.writeFileSync('lesson.json', JSON.stringify(rsArr));
			});
		});
		// 读取时出错
		s.on('error', (err) => {
		  console.error(err);
		});
	},
	getAllLessons: function() {
		// readLineStream第一个参数为ReadStream实例，也可以为文件名
		var strData = '';
		const s = readLine(fs.createReadStream('./course.json'), {
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
			var rsArr = [];
			dataObj.forEach(function(e, i) {
				splider.getLessonList(e.id, function(data) {
					rsArr = rsArr.concat(data.lessonList);
						eventEmitter.emit('getlessons', function() {
					});
				});
					
			});
			eventEmitter.on('getlessons', function() {
				fs.writeFileSync('lessons.json', JSON.stringify(c));
			});
		});
		// 读取时出错
		s.on('error', (err) => {
		  console.error(err);
		});
	},
	getAllVideos: function() {
		// readLineStream第一个参数为ReadStream实例，也可以为文件名
		var strData = '';
		const s = readLine(fs.createReadStream('./lessons4.json'), {
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
			// console.log(dataObj)
			var rsArr = [];
			dataObj.forEach(function(e, i) {
	
				splider.getVideoUrl(e.lesson_id, function(data) {
					console.log(data)
					rsArr.push(data);
						eventEmitter.emit('getvideo', function() {
					});
				});				
					
			});
			eventEmitter.on('getvideo', function() {
				console.log(rsArr.length)
				fs.writeFileSync('video5.json', JSON.stringify(rsArr));
			});
		});
		// 读取时出错
		s.on('error', (err) => {
		  console.error(err);
		});
	}
}

// splider.getCourseList('python');
// splider.getLessonList('425');
// splider.getLessonDetail('425-5488')

// controller.getAllCourse();
// controller.getAllLesson();
// controller.getAllLessons();
controller.getAllVideos();

