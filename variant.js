class Variant{
	
	constructor(fields, samples, contigLength){
		this.fields = fields;
		this.contig = this.fields[0];
		this.position = parseInt(fields[1], 10) || 0;
		this.telomere = this.position === 0 || this.position > contigLength;
		this.identifiers = fields[2].split(';');
		this.ref = fields[3];
		this.alt = fields[4];
		this.quality = parseFloat(fields[5]) || 0;
		this.filter = fields[6];
		this.info = {}; 
		fields[7].split(';').forEach((infoField) => {
			let infoParts = infoField.split('=');
			this.info[infoParts[0]] = infoParts[1];
		});
		this.format = {};
		let formatFields = fields[8].split(':');
		let sampleFormats = fields.slice(9);
		let self = this;
		sampleFormats.forEach((sf, sampleIndex) => {
			let sampleValues = sf.split(':');
			this.format[samples[sampleIndex]] = {};
			formatFields.forEach((ff, index) => {
				self.format[samples[sampleIndex]][ff] = sampleValues[index];
			})
		});
	}
	
	get isRef(){
		return this.Alt === '.';	
	}
	
	get isSNP(){
		return this.ref.length === 1 && this.alt.length === 1;	
	}
	
	get isMNP(){
		return this.ref.length > 1 && this.alt.length > 1 && this.ref.length === this.alt.length;
	}
	
	get hasIdentifier(){
		return this.identifiers[0]  !== '.';
	}
	
	get hasdbSNP(){
		return this.hasIdentifier && this.identifers.some((id) => {
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
}

module.exports = Variant;