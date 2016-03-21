declare module edge {
	function func(options):any;
}

declare module "edge" {
	export = edge;
}

declare  class XmlWriter{
	constructor(indent?:boolean);
	startDocument():void;
	startElement(elementName:string):XmlWriter;
	endElement():void;
	writeAttribute(attributeName:string,attributeValue:string):XmlWriter;
	endDocument():void;
	text(value:string):XmlWriter;
}

declare module "xml-writer"{
	export = XmlWriter;
}


declare module "elementtree" {
    export class ElementTree {
        constructor(xml: XMLElement);

        getroot(): XMLElement
        find(name: string): XMLElement;
        findall(name: string): XMLElement[];
    }

    export class XMLElement {
        attrib: { [key: string]: string };
        text: string;
        tag: string;
        getchildren(): XMLElement[];
    }

    export function XML(data: string): XMLElement;
    export function parse(data: string): ElementTree;
    
}