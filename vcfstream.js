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
		var self = this;
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
			The formats property stores data about the FORMAT fields of
			each variant, based on the information from the header.
		*/
		this.formats = {};
		
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
			Automatically read in the header, and then pause
		*/
		this.stream.on('data', this.headerParse);
		
		this.stream.on('end', function(){
			self.emit('end');
		});
	}

	/**
		pass-through method to native stream "resume" method
	*/
	resume(){
		this.stream.resume();
	}
	
	/**
		pass-through method to native stream "pause" method
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
			line.split('\t').splice(9).forEach(function(samp){
				self.samples.push(samp);
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
			this.formats[headerParts[0][1]] = {
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
		let fields = line.split('\t');
		let contig = fields[0];
		if(!this.variants.hasOwnProperty(contig)){
			throw {
				name: 'FormatError',
				message: `Unexpected contig ${contig} found in variant data`
			};
		}
		var newVariant = new Variant(fields, this.samples, 
			this.formats, this.info, this.contigs[contig]);
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
		}
	}
	
	addRange(chrom, startPos, endPos){
		var filterData = {
			chrom: chrom,
			startPos: parseInt(startPos) || 0
		}
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
			if(!this.info[flagName].Type !== 'Flag'){
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
				this.filters.push(function(variant){
					return variant.info.hasOwnProperty(flagName);
				});
			} else {
				this.filters.push(function(variant){
					return !variant.info.hasOwnProperty(flagName);
				});
			}
	}
	
	get allVariants(){
		var variants = [];
		var self = this;
		Object.keys(this.variants).forEach(function(chrom){
			variants = variants.concat(self.variants[chrom]);
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
	return headerParts.map(function(unit){
		return unit.split('=');
	});
}

module.exports = VCFStream;