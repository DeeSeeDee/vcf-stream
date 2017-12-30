exports.sanityCheck = function(test){
	test.expect(1);
	test.deepEqual((4 * 5), 20, 'Sanity check fails.');
	test.done()
}