import XMLWriter = require('xml-writer');

export class Fetch{

  filter:Filter;
  public attributes:string[]=[];
  constructor(public entityName?:string,attr?:string|boolean|string[],filterConditions?){
      if(this.attributes!=undefined) this.setAttributes(attr);
      if(filterConditions!=undefined) this.setFilter(filterConditions);
  }

  toString(){
      var xw = new XMLWriter(true);
      xw.startElement('fetch');
      xw.startElement('entity');
      xw.writeAttribute('name',this.entityName.toLowerCase());
      this.serializeAttributes(this.attributes,xw);
      this.serializeConditions(this.filter,xw);
      xw.endDocument();
      return xw.toString();
  }

  private serializeAttributes(value:Array<string>, writer:XmlWriter):void
  {
    for(var i=0;i<value.length;i++){
      var attr = value[i].toLowerCase();
      if(attr=="*"){
        writer.startElement("all-attributes");
      }
      else{
        writer.startElement("attribute");
        writer.writeAttribute("name",attr);
      }
      writer.endElement();
    }
  }

  public setFilter(filterConditions){
    if(filterConditions!=null){
      if(filterConditions instanceof Filter){
        this.filter=filterConditions;
      }
      else {
        this.filter=this.convert(filterConditions);
      }
    }
  }

  public setAttributes(attributes:boolean|string|string[]){
    if(attributes == null){
      this.attributes = [];
    }
    else {
      if(Array.isArray(attributes)){
        this.attributes = attributes;
      }
      else if (typeof attributes == "string"){
        this.attributes = [<string>attributes];
      }
      else if (typeof attributes == "boolean"){
        this.attributes = ["*"];
      }
    }
  }

  private serializeValue(value):string{
    var strValue = "";
    if(value!==null&&value!==undefined){
        if(value instanceof Date){
          var dateValue = <Date>value;
          // TODO: Refactor this awful code
          var pad2 = x=>String("00" + x).slice(-2);
          strValue = `${dateValue.getUTCFullYear()}-${pad2(dateValue.getUTCMonth())}-${pad2(dateValue.getUTCDate())} ${pad2(dateValue.getUTCHours())}:${pad2(dateValue.getUTCMinutes())}:${pad2(dateValue.getUTCSeconds())}`
        }
        else{
          strValue = value+"";
        }
    }
    return strValue;
  }

  private serializeConditions(filter:Filter, writer:XmlWriter):void{
      if(filter&&filter.conditions&&filter.conditions.length>0){

        var filterTypeName = FilterTypes[filter.filterType].toLowerCase();
        writer.startElement("filter").writeAttribute("type",filterTypeName);

        for(var i=0;i<filter.conditions.length;i++){
          var filterCondition = filter.conditions[i];
          var operatorName = this.operatorNames[filterCondition.operator];
          var attributeName = filterCondition.attribute.toLowerCase();

          writer.startElement("condition")
            .writeAttribute("attribute",attributeName)
            .writeAttribute("operator",operatorName);

          if(filterCondition.values&&filterCondition.values.length>0) {
            if(filterCondition.values.length>1){
              for(var j=0;j<filterCondition.values.length;j++){
                var strValue = this.serializeValue(filterCondition.values[j]);
                writer.startElement("value").text(strValue).endElement();
              }
            }
            else{
              var strValue = this.serializeValue(filterCondition.values[0]);
              writer.writeAttribute("value",strValue);
            }
          }
          writer.endElement() // condition;
        }
        writer.endElement() // filter;
      }
  }

private operatorNames:string []=['eq',	'neq', 'gt',	'ge',	'le',	'lt',	'like',	'not-like',	'in',	'not-in',	'between',	'not-between',	'null',	'not-null'];
private operatorJsonNames:string []=['$eq',	'$neq', '$gt',	'$ge',	'$le',	'$lt',	'$like',	'$notlLike',	'$in',	'$notIn',	'$between',	'$notBetween',	"",/*'null'*/,""/*	'not-null'*/];

  private convert(conditionExpression):Filter {
    var filter = new Filter();
    for(var propName in conditionExpression){
        var propValue = conditionExpression[propName];
        if(propValue==null){
          filter.conditions.push(new Condition(propName,Operators.Null));
        }
        else if (typeof propValue === 'number' || propValue instanceof Number || typeof propValue === 'string' || propValue instanceof String ||
                 typeof propValue === 'boolean' || propValue instanceof Date){
          filter.conditions.push(new Condition(propName,Operators.Equal,[propValue]));
        }
        else if (Array.isArray(propValue)) {
          filter.conditions.push(new Condition(propName,Operators.In,propValue));
        }
        else if (typeof propValue === 'object' && !(propValue instanceof Date))
        {
          for(var i=0;i<this.operatorJsonNames.length;i++){
            var operatorName = this.operatorJsonNames[i];
            if(operatorName && propValue[operatorName]!=undefined) {
              propValue = propValue[operatorName];
              if(Array.isArray(propValue)){
                filter.conditions.push(new Condition(propName,i,propValue));
              }
              else{
                filter.conditions.push(new Condition(propName,i,[propValue]));
              }
              break;
            }
          }
        }
    }
    return filter;
  }
}

enum FilterTypes {And,Or}
class Filter {
  constructor(public conditions?:Array<Condition>,public filterType?:FilterTypes){
    if(this.conditions==null) this.conditions = new Array<Condition>();
    if(this.filterType==null) this.filterType = FilterTypes.And;
  }
}

// https://msdn.microsoft.com/en-us/library/gg309405.aspx
enum Operators {Equal,NotEqual,GreaterThan,GreaterEqual,LessEqual,LessThan,Like, NotLike, In,NotIn,Between,NotBetween, Null,NotNull }
class Condition {
  constructor(public attribute?:string,public operator?:Operators,public values?:Array<any>){
  }
}
