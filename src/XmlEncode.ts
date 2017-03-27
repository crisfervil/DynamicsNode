export class XmlEncode{

    // https://www.w3.org/TR/REC-xml/#sec-common-syn
    // http://www.java2s.com/Code/Java/XML/EncoderandDecoderforXMLelementandattributenames.htm
    // http://www.fileformat.info/info/charset/UTF-16/list.htm

    static XML_NAME_NOT_ALLOWED_CHARACTERS = [' ','<','>','"','\'','&',';'];
    static XML_BEGINNING_NAME_NOT_ALLOWED_CHARACTERS = ['0','1','2','3','4','5','6','7','8','9'];

    static encodeName(value:string):string{

        var encodedValues: string[] = [];
        var encodedName: string = null;

        if (value !== null && value.length > 0) {

            // first character
            if (XmlEncode.XML_BEGINNING_NAME_NOT_ALLOWED_CHARACTERS.indexOf(value[0]) != -1 ||
                XmlEncode.XML_NAME_NOT_ALLOWED_CHARACTERS.indexOf(value[0]) != -1) {
                encodedValues.push(`_x00${value.charCodeAt(0).toString(16)}_`);
            }
            else {
                encodedValues.push(value[0]);
            }

            for (var i = 1; i < value.length; i++) {
                var char = value[i];

                if (XmlEncode.XML_NAME_NOT_ALLOWED_CHARACTERS.indexOf(value[i]) != -1) {
                    encodedValues.push(`_x00${value.charCodeAt(i).toString(16)}_`);
                }
                else {
                    encodedValues.push(value[i]);
                }
            }
        }

        if (encodedValues.length > 0) {
            encodedName = encodedValues.join('');
        }

        return encodedName;

    }

    static decodeName(encodedName:string){

        var decodedNameParts:string[]=[];
        var decodedName:string=null;

        if (encodedName !== null && encodedName.length > 0) {

            for (var i = 0; i < encodedName.length; i++) {
                var char = encodedName[i];
                var encodedChar=false;
                
                if (char === '_') {
                    if (encodedName.length - i > 6 && encodedName[i + 1] === 'x' && encodedName[i + 6] === '_') {
                        var charCodeStr=encodedName.substr(i+2,4);
                        var charCode = parseInt(charCodeStr,16);
                        if (!isNaN(charCode) && isFinite(charCode)) {
                            encodedChar=true;
                            var decodedChar = String.fromCharCode(charCode);
                            decodedNameParts.push(decodedChar);
                            i+=6;
                        }
                    }
                }

                if(!encodedChar){
                    // just a regular char not encoded
                    decodedNameParts.push(char);                    
                }
            }            
        }

        if(decodedNameParts.length>0){
            decodedName = decodedNameParts.join('');
        }

        return decodedName;

    }
}