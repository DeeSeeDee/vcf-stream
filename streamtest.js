var VCFStream = require('./vcfstream.js');

var vStream = new VCFStream('./test/junk.head.vcf');

vStream.on('header', function(){
	console.log('HEADER');
});