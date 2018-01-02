const fs = require('fs'),
	byline = require('byline'),
	EventEmitter = require('events');

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
			console.log('Stream is done');
			self.emit('end');
		});
	}

	/**
		pass-through method to native stream "resume" method
	*/
	resume(){
		this.stream.resume();
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
		//Check if we're on the last line of the header.
		if(line.startsWith('#CHROM')){
			line.split('\t').splice(9).forEach(function(samp){
				self.samples.push(samp);
			});
			this.stream.pause();
			this.stream.removeListener('data', this.headerParse);
			this.stream.on('data', self.variantParse.bind(self));
			this.emit('header');
			console.log('header');
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
				number: headerParts[1][0],
				type: headerParts[2][1],
				description: headerParts[1][1]
			}
		}
		
	}
	
	variantParse(line){
		let contig = line.split('\t')[0];
		if(!this.variants.hasOwnProperty(contig)){
				throw {
					name: 'FormatError',
					message: `Unexpected contig ${contig} found in variant data`
				}
		}
		this.variants[contig].push(line);
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
	return headerLine.replace(/>/, '').split('<')[1].split(',').map(function(unit){
		return unit.split('=');
	});
}

function passFilters(variant){
	return variant.passing(this.filters);
}

module.exports = VCFStream;