var VCFStream = require('../vcfstream.js');
var fs = require('fs');

exports.testVariantStreamHeader = function(test){
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.on('header', function(){
		test.expect(5);
		test.equal(vStream.samples.length, 1,
			'The proper number of samples is extracted from the VCF header.');
		test.equal(vStream.samples[0], 'SL281349',
			'The sample name is properly extracted from the header.');
		test.deepEqual(vStream.allVariants, [], 
			'allVariants accessor works as expected.');
		test.deepEqual(vStream.contigs['chr3'], 198022430, 
			'contig length is properly captured.');
		test.ok(vStream.variants.hasOwnProperty('chr22'), 
			'variant contig is properly captured.');
		test.done();
	});	
}

exports.testVariantStreamSimple = function(test){
	/**
		This time read the entire variant stream for a truncated, 
		simple variant file.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.once('header', function(){
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(3);
		test.equal(vStream.header.length, 50,
			'The expected number of header lines is captured');
		test.equal(vStream.variants['chr1'].length, 150,
			'The expected number of specific contig variants is returned.');
		test.equal(vStream.allVariants.length, 150,
			'The expected number of total variants is returned.');
		test.done();
	});
}