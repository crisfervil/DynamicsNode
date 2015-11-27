export class Fetch{

  filter:Filter;
  constructor(public entityName?:string,public attributes?:Array<string>,filterConditions?){
      if(this.attributes==null) this.attributes=new Array<string>();
      if(filterConditions){
        if(filterConditions instanceof Filter){
          this.filter=filterConditions;
        }
        else {
          this.filter=this.convert(filterConditions);
        }
      }
  }

  toString(){
      var attributes = this.serializeAttributes(this.attributes);
      var filterStr = this.serializeConditions(this.filter);
      return `<fetch><entity name="${this.entityName.toLowerCase()}">${attributes}${filterStr}</entity></fetch>`;
  }

  private serializeAttributes(value:Array<string>):string
  {
    var result = new Array<string>();

    for(var i=0;i<value.length;i++){
      var attr = value[i].toLowerCase();
      if(attr=="*"){
        result.push('<all-attributes/>');
      }else{
        result.push(`<attribute name="${attr}" />`);
      }
    }
    return result.join("");
  }

  private serializeValue(value):string{
    var strValue = "";
    if(value!==null&&value!==undefined){
        if(value instanceof Date){
          var dateValue = <Date>value;
          // TODO: Rebuild this awful code
          var pad2 = x=>String("00" + x).slice(-2);
          strValue = `${dateValue.getUTCFullYear()}-${pad2(dateValue.getUTCMonth())}-${pad2(dateValue.getUTCDate())} ${pad2(dateValue.getUTCHours())}:${pad2(dateValue.getUTCMinutes())}:${pad2(dateValue.getUTCSeconds())}`
        }
        else{
          strValue = value+"";
        }
    }
    return strValue;
  }

  private serializeConditions(filter:Filter){
      var strConditions=new Array<string>();
      if(filter&&filter.conditions&&filter.conditions.length>0){
        for(var i=0;i<filter.conditions.length;i++){
          var filterCondition = filter.conditions[i];
          var operatorName = this.operatorNames[filterCondition.operator];
          if(filterCondition.values&&filterCondition.values.length>0) {
            if(filterCondition.values.length>1){
              strConditions.push(`<condition attribute="${filterCondition.attribute}" operator="${operatorName}">`);
              for(var j=0;j<filterCondition.values.length;j++){
                var strValue = this.serializeValue(filterCondition.values[j]);
                strConditions.push(`<value>${strValue}</value>`);
              }
              strConditions.push("</condition>");
            }
            else{
              var strValue = this.serializeValue(filterCondition.values[0]);
              strConditions.push(`<condition attribute="${filterCondition.attribute}" operator="${operatorName}" value="${strValue}" />`);
            }
          }else
          {
            strConditions.push(`<condition attribute="${filterCondition.attribute}" operator="${operatorName}" />`);
          }
        }
      }
      if(strConditions.length>0){
        var filterTypeName = FilterTypes[filter.filterType].toLowerCase();
        strConditions.unshift(`<filter type="${filterTypeName}">`);
        strConditions.push("</filter>");
      }
      return strConditions.join("");
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
              filter.conditions.push(new Condition(propName,i,propValue));
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
