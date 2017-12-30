const Variant = require('../variant.js');

exports.testVariantClass = function(test){
	test.expect(2);
	var variant = new Variant();
	var crappyVariant = new Variant();
	variant.Filter = 'PaSs';
	crappyVariant.Filter = 'Blegh';
	test.ok(variant.passing, 
		'A passing filter is understood as such.');
	test.equal(crappyVariant.passing, false, 
		'A non-passing filter is correctly understood.');
	test.done();
}