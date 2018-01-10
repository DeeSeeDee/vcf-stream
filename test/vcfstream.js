var VCFStream = require('../vcfstream.js');

exports.testVariantStreamHeader = function(test){
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.on('header', function(){
		test.expect(6);
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
		test.equal(vStream.formats['DP'].type, 'Integer',
			'Format "number" is properly captured.');
		test.done();
	});	
};

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
		test.expect(4);
		test.equal(vStream.header.length, 50,
			'The expected number of header lines is captured');
		test.equal(vStream.variants['chr1'].length, 147,
			'The expected number of specific contig variants is returned for chr1.');
		test.equal(vStream.variants['chr2'].length, 3,
			'The expected number of specific contig variants is returned for chr2.');
		test.equal(vStream.allVariants.length, 150,
			'The expected number of total variants is returned.');
		test.done();
	});
};

exports.testVariantStreamWithRange = function(test){
	/**
		Apply a range filter with a defined start and end.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.addRange('chr1', 20304, 40000);
	vStream.once('header', function(){
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(3);
		test.equal(vStream.variants['chr1'].length, 8,
			'The expected number of specific, position-filtered contig variants is returned for chr1.');
		test.equal(vStream.variants['chr2'].length, 0,
			'No filtered variants should be returned for chr2.');
		test.equal(vStream.allVariants.length, 8,
			'The expected number of total variants is returned.');
		test.done();
	});
};

exports.testVariantStreamWithRangeOpen = function(test){
	/**
		Apply a range filter with a defined start and no end.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.addRange('chr1', 237800);
	vStream.once('header', function(){
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(3);
		test.equal(vStream.variants['chr1'].length, 9,
			'The expected number of specific, position-filtered contig variants is returned for chr1.');
		test.equal(vStream.variants['chr2'].length, 0,
			'No filtered variants should be returned for chr2.');
		test.equal(vStream.allVariants.length, 9,
			'The expected number of total variants is returned.');
		test.done();
	});
};

exports.testVariantStreamWithInfoFlagFilter = function(test){
	/**
		Apply an info flag filter ("DB" in this case).
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.once('header', function(){
		vStream.addInfoFlagFilter('DB', true);
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 46, 'Filtering on INFO flag.');
		test.done();
	});
};

exports.testVariantStreamWithInfoFlagFilterInverse = function(test){
	/**
		Apply an info flag filter ("DB" in this case), but for the absence of the flag.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.once('header', function(){
		vStream.addInfoFlagFilter('DB');
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 104, 'Filtering on INFO flag.');
		test.done();
	});
};

exports.testVariantStreamWithInfoRangeFilter = function(test){
	/**
		Apply an info flag filter ("DB" in this case), but for the absence of the flag.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.once('header', function(){
		vStream.addInfoRangeFilter('DP', 50);
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 19, 'Filtering on INFO flag.');
		test.done();
	});
};

exports.testVariantStreamWithInfoRangeFilterBoth = function(test){
	/**
		Apply an info flag filter ("DB" in this case), but for the absence of the flag.
	*/
	var vStream = new VCFStream('./test/SL281349.head.vcf');
	vStream.once('header', function(){
		vStream.addInfoRangeFilter('DP', 0, 10);
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 40, 'Filtering on INFO flag.');
		test.done();
	});
};

exports.testVariantStreamWithInfoStringFilter = function(test){
	/**
		Apply a basic info string filter for a made-up field("ZZ").
	*/
	var vStream = new VCFStream('./test/SL281349.infostring.vcf');
	vStream.once('header', function(){
		vStream.addStringFilter({
			fieldType: 'info',
			string: 'est',
			field: 'ZZ'
		});
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 2, 'Filtering on INFO flag.');
		test.done();
	});
};

exports.testVariantStreamWithInfoStringFilterExact = function(test){
	/**
		Apply an exact-match info string filter for a made-up field("ZZ").
	*/
	var vStream = new VCFStream('./test/SL281349.infostring.vcf');
	vStream.once('header', function(){
		vStream.addStringFilter({
			fieldType: 'info',
			string: 'Test',
			field: 'ZZ',
			exact: true
		});
		vStream.resume();
	});
	vStream.on('end', function(){
		test.expect(1);
		test.equal(vStream.allVariants.length, 1, 'Filtering on INFO flag, exact match.');
		test.done();
	});
};