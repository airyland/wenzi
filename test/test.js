var lib = require('../index');
var start = new Date().getTime();
lib.LexicalCheck('粤经',function(data){
	console.log(data);
	console.log('takes:',new Date().getTime()-start);
});