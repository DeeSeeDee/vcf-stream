const Variant = require('../variant.js');

exports.testBasicVariant = function(test){
	test.expect(17);
	let variantLine = 'chr1	10397	.	CCCCTAA	C	79.73	PASS	AC=1;AF=0.500;AN=2;DP=12;FS=0.000;MQ=44.71;MQRankSum=1.537;QD=6.64;ReadPosRankSum=1.537;SOR=0.991;FractionInformativeReads=0.500	GT:AD:DP:GQ:PL:SB	0/1:3,3:6:99:117,0,128:2,1,1,2';
	var variant = new Variant(variantLine.split('\t'), 
		['SL281349'], 249250621);
	test.equal(variant.contig, 'chr1', 'Contig is properly captured.');
	test.deepEqual(variant.simpleContig, '1', 'Simple contig property.');
	test.deepEqual(variant.position, 10397, 'Position accessor has correct type and value.');
	test.deepEqual(variant.identifiers, ['.'], 'Identifiers property.');
	test.deepEqual(variant.hasIdentifier, false, 'hasIdentifier accessor.');
	test.deepEqual(variant.hasdbSNP, false, 'hasdbSNP accessor.');
	test.equal(variant.ref, 'CCCCTAA', 'ref property.');
	test.equal(variant.alt, 'C', 'alt property.');
	test.deepEqual(variant.isSNP, false, 'isSNP accessor.');
	test.deepEqual(variant.isMNP, false, 'isMNP accessor.');
	test.deepEqual(variant.isInsertion, false, 'isInsertion accessor.');
	test.deepEqual(variant.isDeletion, true, 'isDeletion accessor.');
	test.deepEqual(variant.passing, true, 'isPassing accessor.');
	test.deepEqual(variant.telomere, false, 'telomere property');
	test.equal(variant.variantLine, variantLine, 'variant is properly reconstructed.');
	test.equal(variant.info['MQ'], '44.71', 'A single info key-value pair.');
	test.equal(variant.format['SL281349']['PL'], '117,0,128', 'A single format key-value pair.');
	test.done();
}

