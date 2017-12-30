const fs = require('fs'),
	path = require('path'),
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
		console.log(this.header);
		/**
			The "variants" property stores variants by contig
		*/
		this.variants = {};
		
		/**
			The contigs property stores contig length information
		*/
		this.contigs = {};
		
		/**
			This array stores the sample names in the order 
			which they appear in the header line.
		*/
		this.samples = [];
		
		this.stream = byline.createStream(fs.createReadStream(
			vcfPath, { encoding: 'utf8' }));
		
		/**
			Automatically read in the header, and then pause
		*/
		this.stream.on('data', this.headerParse.bind(this));
		
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
		console.log(line);
		if(line.startsWith('#CHROM')){
			//This is the last line of the header.
			line.split('\t').splice(9).forEach(function(samp){
				self.samples.push(samp);
			});
			this.stream.pause();
			this.stream.removeListener('data', self.headerParse);
			this.stream.addListener('data', self.variantParse);
			this.emit('header');
			console.log('header');
			return;
		}
		if(line && !this.header.length && !line.startsWith('#')){
			throw('This does not appear to be a VCF file.');
		}
		this.header.push(line);
	}
	
	variantParse(line){
		console.log('yip');
	}
	
	get allVariants(){
		return Object.keys(this.variants).reduce(function(key){
			variants = variants.concat(this.variants[key])
		 }, []);
	}	
}

module.exports = VCFStream;