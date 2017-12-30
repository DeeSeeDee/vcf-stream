var VCFStream = require('../vcfstream.js');
var fs = require('fs');

exports.testVariantStreamHeader = function(test){
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.on('header', function(){
		test.expect(4);
		test.equal(vStream.samples.length, 1,
			'The proper number of samples is extracted from the VCF header.');
		test.equal(vStream.samples[0], 'SL281349',
			'The sample name is properly extracted from the header.');
		test.deepEqual(vStream.variants, {}, 
			'No variants are stored from the header read.');
		test.deepEqual(vStream.allVariants, [], 
			'allVariants accessor works as expected.');
		test.done();
	});	
}
/*
exports.testVariantStreamSimple = function(test){
	
		This time read the entire variant stream for a truncated, 
		simple variant file.
	
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.on('header', function(){
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(2);
		test.
	});
}
*/