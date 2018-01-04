const Variant = require('../variant.js');

exports.testBasicVariant = function(test){
	test.expect(18);
	let variantLine = 'chr1	10397	.	CCCCTAA	C	79.73	PASS	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2';
	let variant = new Variant(variantLine.split('\t'), 
		['SL281349'], formatFields, infoFields, 249250621);
	test.equal(variant.contig, 'chr1', 'Contig is properly captured.');
	test.deepEqual(variant.simpleContig, '1', 'Simple contig property.');
	test.deepEqual(variant.position, 10397, 'Position accessor has correct type and value.');
	test.deepEqual(variant.identifiers, ['.'], 'Identifiers property.');
	test.deepEqual(variant.hasIdentifier, false, 'hasIdentifier accessor.');
	test.deepEqual(variant.hasdbSNP, false, 'hasdbSNP accessor.');
	test.equal(variant.ref, 'CCCCTAA', 'ref property.');
	test.equal(variant.alt, 'C', 'alt property.');
	test.deepEqual(variant.isRef, false, 'isRef accessor.');
	test.deepEqual(variant.isSNP, false, 'isSNP accessor.');
	test.deepEqual(variant.isMNP, false, 'isMNP accessor.');
	test.deepEqual(variant.isInsertion, false, 'isInsertion accessor.');
	test.deepEqual(variant.isDeletion, true, 'isDeletion accessor.');
	test.deepEqual(variant.passing, true, 'isPassing accessor.');
	test.deepEqual(variant.telomere, false, 'telomere property');
	test.equal(variant.variantLine, variantLine, 'variant is properly reconstructed.');
	test.equal(variant.info['MQ'], 44.71, 
		'A single info key-value pair with the correct type.');
	test.deepEqual(variant.format['SL281349']['PL'], [117,0,128], 
		'A single format key-value pair, properly split and typed.');
	test.done();
};

exports.testMultiSampleSNPVariant = function(test){
	test.expect(22);
	let variantLine = 'chrX	51191322	rs8134818	G	C	79.73	HardFilter	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2	1/1:3,3:6:39:117,0,128:2,1,1,2';
	let variant = new Variant(variantLine.split('\t'), 
		['SL281349', 'SL851811'], formatFields, infoFields, 249250621);
	test.equal(variant.contig, 'chrX', 'Contig is properly captured.');
	test.deepEqual(variant.simpleContig, 'X', 'Simple contig property.');
	test.deepEqual(variant.position, 51191322, 'Position accessor has correct type and value.');
	test.deepEqual(variant.identifiers, ['rs8134818'], 'Identifiers property.');
	test.deepEqual(variant.hasIdentifier, true, 'hasIdentifier accessor.');
	test.deepEqual(variant.hasdbSNP, true, 'hasdbSNP accessor.');
	test.equal(variant.ref, 'G', 'ref property.');
	test.equal(variant.alt, 'C', 'alt property.');
	test.deepEqual(variant.isRef, false, 'isRef accessor.');
	test.deepEqual(variant.isSNP, true, 'isSNP accessor.');
	test.deepEqual(variant.isMNP, false, 'isMNP accessor.');
	test.deepEqual(variant.isInsertion, false, 'isInsertion accessor.');
	test.deepEqual(variant.isDeletion, false, 'isDeletion accessor.');
	test.deepEqual(variant.passing, false, 'isPassing accessor.');
	test.deepEqual(variant.telomere, false, 'telomere property');
	test.equal(variant.variantLine, variantLine, 'variant is properly reconstructed.');
	test.equal(variant.info['MQ'], 44.71, 'A single info key-value pair.');
	test.equal(variant.info['DB'], undefined, 'A single info flag.');
	test.deepEqual(variant.info['AC'], [1], 'A single info key-value pair.');
	test.deepEqual(variant.info['AF'], [0.5], 'A single info key-value pair.');
	test.equal(variant.format['SL851811']['GQ'], 39, 'A single format key-value pair.');
	test.deepEqual(variant.format['SL851811']['AD'], [3,3], 'Another single format key-value pair.');
	test.done();
};

exports.testReferenceVariant = function(test){
	test.expect(11);
	let variantLine = 'chrM	1512	.	A	.	79.73	PASS	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2';
	let variant = new Variant(variantLine.split('\t'), 
		['SL281349'], formatFields, infoFields, 16571);
	test.equal(variant.contig, 'chrM', 'Contig is properly captured.');
	test.deepEqual(variant.simpleContig, 'M', 'Simple contig property.');
	test.equal(variant.ref, 'A', 'ref property.');
	test.equal(variant.alt, '.', 'alt property.');
	test.deepEqual(variant.isRef, true, 'isRef accessor.');
	test.deepEqual(variant.isSNP, false, 'isSNP accessor.');
	test.deepEqual(variant.isMNP, false, 'isMNP accessor.');
	test.deepEqual(variant.isInsertion, false, 'isInsertion accessor.');
	test.deepEqual(variant.isDeletion, false, 'isDeletion accessor.');
	test.deepEqual(variant.telomere, false, 'telomere property');
	test.equal(variant.variantLine, variantLine, 'variant is properly reconstructed.');
	test.done();
};

exports.testTelomereVariant = function(test){
	test.expect(12);
	let variantLine = 'chrM	1512	.	A	.	79.73	PASS	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500;DB	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2';
	let variant = new Variant(variantLine.split('\t'), 
		['SL281349'], formatFields, infoFields, 16571);
	test.equal(variant.contig, 'chrM', 'Contig is properly captured.');
	test.deepEqual(variant.simpleContig, 'M', 'Simple contig property.');
	test.equal(variant.ref, 'A', 'ref property.');
	test.equal(variant.alt, '.', 'alt property.');
	test.deepEqual(variant.isRef, true, 'isRef accessor.');
	test.deepEqual(variant.isSNP, false, 'isSNP accessor.');
	test.deepEqual(variant.isMNP, false, 'isMNP accessor.');
	test.deepEqual(variant.isInsertion, false, 'isInsertion accessor.');
	test.deepEqual(variant.isDeletion, false, 'isDeletion accessor.');
	test.deepEqual(variant.telomere, false, 'telomere property');
	test.deepEqual(variant.info['DB'], true, 'A flag format field.');
	test.equal(variant.variantLine, variantLine, 
		'variant is properly reconstructed.');
	test.done();
};

exports.testBogusContigLength = function(test){
	test.expect(1);
	let variantLine = 'chrM	16573	.	A	.	79.73	PASS	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2';
	test.throws(function(){
		new Variant(variantLine.split('\t'), 
			['SL281349'], formatFields, infoFields, 16571)
		}, 'Fail when contig length is too long.');
	test.done();
};

var formatFields = {
	'AD': {
		'type': 'Integer',
		'number': '.'
	},
	'DP': {
		'type': 'Integer',
		'number': '1'
	},
	'GQ': {
		'type': 'Integer',
		'number': '1'
	},
	'GT': {
		'type': 'String',
		'number': '1'
	},
	'PL': {
		'type': 'Integer',
		'number': 'G'
	},
	'SB': {
		'type': 'Integer',
		'number': '4'
	}
};

var infoFields = {
	'AC': {
		'type': 'Integer',
		'number': 'A'
	},
	'AF': {
		'type': 'Float',
		'number': 'A'
	},
	'AN': {
		'type': 'Integer',
		'number': '1'
	},
	'DP': {
		'type': 'Integer',
		'number': '1'
	},
	'FS': {
		'type': 'Float',
		'number': '1'
	},
	'MQ': {
		'type': 'Float',
		'number': '1'
	},
	'MQRankSum': {
		'type': 'Float',
		'number': '1'
	},
	'QD': {
		'type': 'Float',
		'number': '1'
	},
	'ReadPosRankSum': {
		'type': 'Float',
		'number': '1'
	},
	'SOR': {
		'type': 'Float',
		'number': '1'
	},
	'FractionInformativeReads': {
		'type': 'Float',
		'number': '1'
	},
	'DB': {
		'type': 'Flag',
		'number': '0'
	}
}