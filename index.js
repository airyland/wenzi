var ksort = require('./ksort');
var crypto = require('crypto');
var config = require('./config.json');
var key = config.SecretKey;
var id = config.SecretId;
var request = require('request');
var path = require('path');

var Datastore = require('nedb'),
	db = new Datastore({
		filename: path.dirname(__filename) + '/request.log',
		autoload: true
	}),
	log = new Datastore({
		filename: path.dirname(__filename) + '/history.log',
		autoload: true
	});

var random = function(MIN, MAX) {
	return Math.floor((MAX - MIN + 1) * Math.random()) + MIN;
};

exports.LexicalCheck = function(text, cb) {
	var callback = function(data) {
		log.insert({
			text: text,
			res: data,
			time: new Date().getTime()
		});
		cb(data);
	};
	// check history
	db.find({
		text: text
	}, function(err, doc) {
		if (doc.length >= 1) {
			callback(doc[0].res);
		} else {
			var params = {
				'Action': 'LexicalCheck',
				'Nonce': random(999, 9999),
				'Region': 'gz',
				'Timestamp': Math.round(new Date().getTime() / 1000),
				'SecretId': id,
				'text': text
			};
			params = ksort(params);
			var rs = [];
			for (var i in params) {
				rs.push(i + '=' + params[i]);
			}
			rs = rs.join('&');
			var method = 'POST';
			var pre = method + 'wenzhi.api.qcloud.com/v2/index.php?';
			rs = pre + rs;
			var Signature = crypto.createHmac('sha1', key).update(rs, 'utf8').digest('base64');
			params.Signature = Signature;
			request.post('https://wenzhi.api.qcloud.com/v2/index.php', {
				form: params
			}, function(err, http, data) {
				db.insert({
					text: text,
					res: JSON.parse(data)
				});
				callback(JSON.parse(data));
			});

		}
	});
};