class Variant{
	
	/**
		The Variant constructor takes an array of fields. 
		The easiest way is to split the variant line on tabs.
		For example: variantTextLine.split('\t')
		It also takes an array of sample names in the order
		in which they appear in the VCF header, as well as the
		length of the contig (chromosome) on which the variant occurs.
	*/
	constructor(fields, samples, formatTypes, infoTypes, contigLength){
		this.fields = fields;
		this.contig = this.fields[0];
		this.position = parseInt(fields[1], 10) || 0;
		if(this.position > contigLength + 1){
			throw {
				name: 'VariantError',
				message: `Variant position ${this.position} is nonsensical given contig length ${contigLength}`
			};
		}
		this.telomere = this.position === 0 || this.position === contigLength + 1;
		this.identifiers = fields[2].split(';');
		this.ref = fields[3];
		this.alt = fields[4];
		this.quality = parseFloat(fields[5]) || 0;
		this.filter = fields[6];
		this.info = {}; 
		fields[7].split(';').forEach((infoField) => {
			let infoParts = infoField.split('=');
			switch (infoTypes[infoParts[0]].type){
				case 'Flag':
					this.info[infoParts[0]] = true;
					break;
				case 'Integer':
					if (infoTypes[infoParts[0]].number === '1'){
						this.info[infoParts[0]] = parseInt(infoParts[1]) || 0;
					} else {
						this.info[infoParts[0]] = infoParts[1].split(',').map((val) => {
							return parseInt(val) || 0;
						});
					}
					break;
				case 'Float':
					if (infoTypes[infoParts[0]].number === '1'){
						this.info[infoParts[0]] = parseFloat(infoParts[1]) || 0;
					} else {
						this.info[infoParts[0]] = infoParts[1].split(',').map((val) => {
							return parseFloat(val) || 0;
						});
					}
					break;
				default:
					if (infoTypes[infoParts[0]].number === '1'){
						this.info[infoParts[0]] = infoParts[1].toString();
					} else {
						this.info[infoParts[0]] = infoParts[1].split(',');
					}
					break;
			}
		});
		this.format = {};
		let formatFields = fields[8].split(':');
		let sampleFormats = fields.slice(9);
		let self = this;
		sampleFormats.forEach((sf, sampleIndex) => {
			if(!samples[sampleIndex]){
				return;
			}
			let sampleValues = sf.split(':');
			let sampleName = samples[sampleIndex].name;
			this.format[sampleName] = {};
			formatFields.forEach((ff, index) => {
				switch (formatTypes[ff].type){
					case 'Integer':
						if (formatTypes[ff].number === '1'){
							self.format[sampleName][ff] = 
								parseInt(sampleValues[index]) || 0;
						} else {
							self.format[sampleName][ff] = sampleValues[index]
								.split(',').map((val) => {
									return parseInt(val) || 0;
								});
						}
						break;
					case 'Float':
						if (formatTypes[ff].number === '1'){
							self.format[sampleName][ff] = 
								parseFloat(sampleValues[index]) || 0;
						} else {
							self.format[sampleName][ff] = sampleValues[index]
								.split(',').map((val) => {
									return parseFloat(val) || 0;
								});
						}
						break;
					default:
						//String or Character
						if (formatTypes[ff].number === '1'){
							self.format[sampleName][ff] = sampleValues[index].toString();
						} else {
							self.format[sampleName][ff] = sampleValues[index].split(',');
						}
						break;
				}
			});
		});
	}
	
	fieldValues(fieldType, fieldID, samples){
		var values = [];
		if(fieldType == 'info'){
			if(!Array.isArray(this.info[fieldID])){
				return [ this.info[fieldID] ];
			} else {
				return this.info[fieldID];
			}
		}
		if(!samples.length){
			samples = Object.keys(this.format);
		}
		samples.forEach((sample) => {
			if(Array.isArray(this.format[sample][fieldID])){
				this.format[sample][fieldID].forEach((fieldVal) => {
					values.push(fieldVal);
				});
			} else {
				values.push(this.format[sample][fieldID]);
			}
		});		
		return values;
	}
	
	get isRef(){
		return this.alt === '.';	
	}
	
	get isSNP(){
		return this.isRef === false && this.ref.length === 1 
			&& this.alt.length === 1;	
	}
	
	/**
		Catch the relatively unusual multinucleotide polymorphism, 
		which is created by some variant callers. 
	*/
	get isMNP(){
		return this.ref.length > 1 && this.alt.length > 1 
			&& this.ref.length === this.alt.length;
	}
	
	get hasIdentifier(){
		return this.identifiers[0]  !== '.';
	}
	
	get hasdbSNP(){
		return this.hasIdentifier && this.identifiers.some((id) => {
			return id.toLowerCase().startsWith('rs');
		});
	}
	
	get isInsertion(){
		return this.alt.length > this.ref.length;	
	}
	
	get isDeletion(){
		return this.ref.length > this.alt.length;	
	}
	
	get passing(){
		return this.filter.toLowerCase() === 'pass';
	}
	
	get variantLine(){
		return this.fields.join('\t');
	}
	
	get simpleContig(){
		return this.contig.replace(/^chr/, '');
	}
	
	/**
		Alias of contig property.
	*/
	get chrom(){
		return this.contig;
	}
}

module.exports = Variant;