class Variant{
	
	constructor(fields, contigLength){
		this.fields = fields;
		this.contigLength = contigLength;
	}
	
	get passing(){
		return this.Filter.toLowerCase() === 'pass';	
	}
	
	get isRef(){
		return this.Alt === '.';	
	}
	
	get Telomere(){
		return this.Position === 0 || this.Position > this.contigLength;
	}
	
	get SNP(){
		return this.Ref.length === 1 && this.Alt.length === 1;	
	}
	
	get Insertion(){
		return this.Alt.length > this.Ref.length;	
	}
	
	get Deletion(){
		return this.Ref.length > this.Alt.length;	
	}
}

module.exports = Variant;