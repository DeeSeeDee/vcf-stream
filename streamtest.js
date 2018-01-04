var VCFStream = require('./vcfstream.js');

var vStream = new VCFStream('./test/SL281349.head.vcf');

vStream.on('header', function(){
	vStream.resume();
});