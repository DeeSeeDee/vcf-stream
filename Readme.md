#VCFStream.js

I built this to get more familiar with ES2015 syntax and work through the finer points of the VCF specification. Hopefully it's useful or has the potential to become useful to others in the bioinformatics field.

There are two main classes in the package: `VCFStream` and `Variant`. An instance of the `Variant` class is intended to encapsulate a single variant from a VCF file. 

`VCFStream` is what reads in a single VCF file containing one or more samples. It automatically reads the VCF header via a Node stream and builds its internal data structures based on the information in the header. After the instance ingests the header, it emits a `header` event and pauses the stream.

At this point filters can be added to the stream. Users can filter on specific samples by passing an array of sample names to the `addSampleFilter` method. Regions, denoted by a contig (chromosome) name, start position, and an optional end position, can be added using the `addInterval` method. 

Other filters include:

 + `addInfoFlagFilter` to filter on the presence or absence of an `INFO` field having a "Flag" type.
 + `addStringFilter` to filter in an exact or loose-match fashion on `INFO` or `FORMAT` fields having a String type.
 + `addRangeFilter` to filter on numeric `INFO` or `FORMAT` fields using lower and optional upper numeric bounds

The latter two filters take a `matchType` property in the filter object. This can be one of three values:

 + `all` All items in the field for the variant must meet the filtering criteria
 + `any` At least one item must meet the filtering criteria
 + `none` No item in the field may meet the filtering criteria.

You can add your own filtering function as well. For example, if you to add a filter that only passes variants which are single-nucleotide polymorphisms:

    vcfStream.filters.push((variant) => { return variant.isSNP; });

Any variant that passes all of the filters in place will be stored. When that variant is processed, the `VCFStream` instance will emit a `variant` event.

When the `VCFStream` instance reaches the end of the file, it will emit an `end` event.

It's backed by a large suite of unit tests. All suggestions welcome. If others find this interesting or worthwhile, I will invest more time to create full documentation, and add many more features. Please post a comment here or on the Github project with your feedback. All collaborations and pull requests are welcome too, of course. Thanks!