const fs = require('fs'),
	byline = require('byline'),
	EventEmitter = require('events'),
	Variant = require('./variant.js');

class VCFStream extends EventEmitter{
	
	constructor(vcfPath){
		super();
		//read the stream until the lines no longer start with #
		if(!fs.existsSync(vcfPath)){
			throw(`The VCF path ${vcfPath} is not available.`);
		}
		this.header = [];
		/*
			This bind statement facilitates removing the event listener 
			after the header has been processed.
		*/
		this.headerParse = this.headerParse.bind(this);
		/**
			The "variants" property stores variants by contig
		*/
		this.variants = {};
		
		/**
			The contigs property stores contig length information
		*/
		this.contigs = {};
		
		/**
			The format property stores data about the FORMAT fields of
			each variant, based on the information from the header.
		*/
		this.format = {};
		
		/**
			The info property stores data about the INFO fields of
			each variant, based on the information from the header.
		*/
		this.info = {};
		
		/**
			This array stores the sample names in the order 
			which they appear in the header line.
		*/
		this.samples = [];
		
		/**
			This array stores samples to be captured during 
			a filtering operation, if any.
			An empty array is ignored during filtering.
		 */
		this.samplesFilter = [];

		/**
			This array stores the position range filters
		*/
		this.ranges = [];
		
		/**
			A collection of filters to apply to variants being streamed.
			If a variant fails, it's not added to the collection.
		*/
		this.filters = [];
		
		this.stream = byline.createStream(fs.createReadStream(
			vcfPath, { encoding: 'utf8' }));
		
		/**
			Automatically process the header, and then pause
		*/
		this.stream.on('data', this.headerParse);
		
		this.stream.on('end', () => {
			this.emit('end');
		});
	}

	/**
		pass-through method to native stream "resume"
	*/
	resume(){
		this.stream.resume();
	}
	
	/**
		pass-through method to native stream "pause"
	*/
	pause(){
		this.stream.pause();
	}
	
	headerParse(line){
		var self = this;
		//Check to make sure VCF is valid.
		if(line && !this.header.length && !line.startsWith('#')){
			throw {
				name: 'FiletypeError',
				message: 'This does not appear to be a VCF file.'
			};
		}
		this.header.push(line);
		/**
			Check if we're on the last line of the header.
			If so, capture the sample names from the line and 
			then halt the stream, switch over to processing 
			lines as variants, and notify that the header has
			been processed.
		*/
		if(line.startsWith('#CHROM')){
			line.split('\t').splice(9).forEach( (samp, index) => {
				this.samples.push({
					name: samp,
					index: index	
				});
			});
			this.stream.pause();
			this.stream.removeListener('data', this.headerParse);
			this.stream.on('data', self.variantParse.bind(self));
			this.emit('header');
			return;
		}
		
		//store contig information
		if(line.startsWith('##contig')){
			let headerParts = processHeaderField(line);
			let contig = headerParts[0][1];
			this.contigs[contig] = parseInt(headerParts[1][1]);
			this.variants[contig] = [];
			return;
		}
		
		if(line.startsWith('##FORMAT')){
			let headerParts = processHeaderField(line);
			this.format[headerParts[0][1]] = {
				number: headerParts[1][1],
				type: headerParts[2][1],
				description: headerParts[1][1]
			};
		}
		
		if(line.startsWith('##INFO')){
			let headerParts = processHeaderField(line);
			this.info[headerParts[0][1]] = {
				number: headerParts[1][1],
				type: headerParts[2][1],
				description: headerParts[1][1]
			};
		}
	}
	
	variantParse(line){
		line = line.trim();
		let fields = line.split('\t');
		let contig = fields[0];
		if(!this.variants.hasOwnProperty(contig)){
			throw {
				name: 'FormatError',
				message: `Unexpected contig ${contig} found in variant data`
			};
		}
		var newVariant = new Variant(fields, this.samples, 
			this.format, this.info, this.contigs[contig]);
		var failedFilters = false;
		//Check position ranges
		if(this.ranges.length){
			if(!this.ranges.filter((range) => {
				return contig === range.chrom;
			}).some((range) => {
				if(range.endPos){
					return newVariant.position >= range.startPos 
						&& newVariant.position <= range.endPos;
				} else {
					return newVariant.position >= range.startPos;
				}
			})){
				failedFilters = true;
			}
		}
		//Check filters
		if(!failedFilters && this.filters.length){
			if(!this.filters.every((filter) => {
				return filter.call(this, newVariant);
			})){
				failedFilters = true;
			}
		}
		if(!failedFilters){
			this.variants[contig].push(newVariant);
			this.emit('variant');
		}
	}
	
	addRange(chrom, startPos, endPos){
		var filterData = {
			chrom: chrom,
			startPos: parseInt(startPos) || 0
		};
		if(endPos){
			filterData['endPos'] = parseInt(endPos) || 0;
		}
		this.ranges.push(filterData);
	}
	
	addInfoFlagFilter(flagName, flagPresent){
		flagName = flagName.toUpperCase();
		if(!this.info.hasOwnProperty(flagName)){
			throw {
				name: 'FilterException',
				message: `The INFO field ${flagName} was not found in the VCF header`
			};
		}
		if(this.info[flagName].type !== 'Flag'){
			throw {
				name: 'FilterException',
				message: `The INFO field ${flagName} is not a "Flag" type`
			};
		}
		/**
			If `flagPresent` is truthy, the flag must be set on a variant
			Otherwise, the flag must be absent for the variant being examined.
		*/
		if(flagPresent){
			this.filters.push((variant) => {
				return variant.info.hasOwnProperty(flagName);
			});
		} else {
			this.filters.push((variant) => {
				return !variant.info.hasOwnProperty(flagName);
			});
		}
	}
		
	/**
		Filter by string content. Takes an object as its argument, 
			with the following properties:
		string: Required. String. The string for which to perform the match.
		field: Required. String. The INFO property on which to perform
			the string match. This must be present in the header of the VCF, or an
			Exception object with name "FilterException" will be thrown.
		fieldType: Required. String. INFO or FORMAT.
		exact: Optional. Boolean. if truthy, the string much match exactly, both in case 
			and content. Otherwise, a case-insensitive check for the presence of 
			the 'string' value will be performed.
		matchType: Optional. String. Applies only to INFO field values where the Number is 
			something other than "1". Can have one of three values:			
			'all': (Default) All items must meet the match criteria.
			'any': At least one item must meet the match criteria.
			'none': None of the items can meet the match criteria. 
	*/
	addStringFilter(filterProps){
		['string', 'field', 'fieldType'].forEach((reqProp) => {
			if(!filterProps.hasOwnProperty(reqProp)){
				throw {
					name: 'FilterException',
					message: `The required property ${reqProp} is missing.`
				};
			}
		});
		let field = filterProps.field.toUpperCase();
		let fieldType = filterProps.fieldType.toLowerCase();
		let matchType = (filterProps.matchType || 'all').toLowerCase();
		if(['format', 'info'].indexOf(fieldType) === -1){
			throw {
				name: 'FilterException',
				message: `Invalid field type ${field} specified.`
			};
		}
		if(!this[fieldType].hasOwnProperty(field)){
			throw {
				name: 'FilterException',
				message: `The ${fieldType} field ${field} was not found in the VCF header`
			};
		}
		if(this[fieldType][field].type !== 'String'){
			throw {
				name: 'FilterException',
				message: `The ${fieldType} field ${field} is not a "String" type`
			};
		}
		
		if(filterProps.exact){
			switch(matchType){
				case 'none':
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal !== filterProps.string;
						});
					});
					break;
				case 'any':
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).some((infoVal) => {
							return infoVal === filterProps.string;
						});
					});
					break;
				default:
					//default to 'all'
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal === filterProps.string;
						});
					});
					break;
			}
		} else {
			switch(matchType){
				case 'none':
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal.indexOf(filterProps.string) === -1;
						});
					});
					break;
				case 'any':
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).some((infoVal) => {
							return infoVal.indexOf(filterProps.string) !== -1;
						});
					});
					break;
				default:
					//default to 'all'
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal.indexOf(filterProps.string) !== -1;
						});
					});
					break;
			}
		}
	}
	
	/**
		Filter by numeric range. Takes an object as its argument, 
			with the following properties:
		lowValue: Required. Integer or Float. The low end of the range.
		field: Required. String. The INFO property on which to perform
			the string match. This must be present in the header of the VCF, or an
			Exception object with name "FilterException" will be thrown.
		fieldType: Required. String. INFO or FORMAT.
		highValue: Optional. Integer or Float. The high end of the range.
		matchType: Optional. String. Applies only to INFO field values where the Number is 
			something other than "1". Can have one of three values:			
			'all': (Default) All items must meet the match criteria.
			'any': At least one item must meet the match criteria.
			'none': None of the items can meet the match criteria.
	*/
	addRangeFilter(filterProps){
		['lowValue', 'field', 'fieldType'].forEach((reqProp) => {
			if(!filterProps.hasOwnProperty(reqProp)){
				throw {
					name: 'FilterException',
					message: `The required property ${reqProp} is missing.`
				};
			}
		});
		let lowVal = parseInt(filterProps.lowValue) || 0;
		let field = filterProps.field.toUpperCase();
		let fieldType = filterProps.fieldType.toLowerCase();
		let matchType = (filterProps.matchType || 'all').toLowerCase();
		let highVal = parseInt(filterProps.highValue) || null;
		if(['format', 'info'].indexOf(fieldType) === -1){
			throw {
				name: 'FilterException',
				message: `Invalid field type ${field} specified.`
			};
		}
		if(!this[fieldType].hasOwnProperty(field)){
			throw {
				name: 'FilterException',
				message: `The ${fieldType} field ${field} was not found in the VCF header`
			};
		}
		if(['Integer', 'Float'].indexOf(this[fieldType][field].type) === -1){
			throw {
				name: 'FilterException',
				message: `The ${fieldType} field ${field} is not a numeric type`
			};
		}
		
		switch(matchType){
			case 'none':
				if(highVal){
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return (infoVal < lowVal) || (infoVal > highVal);
						});
					});
				} else {
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal < lowVal;
						});
					});
				}
				break;
			case 'any':
				if(highVal){
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).some((infoVal) => {
							return infoVal >= lowVal && infoVal <= highVal;
						});
					});
				} else {
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).some((infoVal) => {
							return infoVal >= lowVal;
						});
					});
				}
				break;
			default:
				//default to 'all'
				if(highVal){
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal >= lowVal && infoVal <= highVal;
						});
					});
				} else {
					this.filters.push((variant) => {
						return variant.fieldValues(fieldType, field, this.samplesFilter).every((infoVal) => {
							return infoVal >= lowVal;
						});
					});
				}
				break;
		}
	}
	
	addSampleFilter(samples){
		var newSamples = [];
		samples.forEach((sample) => {
			let foundSample = this.samples.find((s) => {
				return s.name == sample;
			});
			if(foundSample){
				newSamples.push(sample);
			}
		});
		this.samplesFilter = newSamples;
	}
	
	get allVariants(){
		var variants = [];
		Object.keys(this.variants).forEach((chrom) => {
			variants = variants.concat(this.variants[chrom]);
		});
		return variants;
	}
}

function processHeaderField(headerLine){
	var interiorSection = headerLine.replace(/>/, '').split('<')[1];
	//Split on commas, ignoring commas in quotes
	var headerParts = interiorSection.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
	if(!headerParts.length){
		headerParts = [interiorSection];
	}
	return headerParts.map((unit) => {
		return unit.split('=');
	});
}

module.exports = VCFStream;