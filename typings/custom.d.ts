declare class XmlWriter{
	constructor(indent?:boolean);
	startDocument():void;
	startElement(elementName:string):XmlWriter;
	endElement():void;
	writeAttribute(attributeName:string,attributeValue:string):XmlWriter;
	endDocument():void;
	text(value:string):XmlWriter;
}