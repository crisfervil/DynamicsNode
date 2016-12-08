import XMLWriter = require('xml-writer');

export class Fetch {

  filter: Filter;
  public attributes: string[] = [];
  
  /** Default Constructor
   * @class Fetch
   * @classdesc Provides properties and methods to create FetchXml queries
   * @param entityName {string} Optional. Name of the entity which the query is for
   * @param attr {string|boolean|string[]} Optional. Either a column name, or a list of column names, or a boolean value indicating that all the attribute values want to be retrieved. The default value is null, and means that only the primary attribute will be retrieved.
   * @param filterConditions {object} Optional. Object that describes conditions in an JSON notation. More Info: {@link Fetch#setFilter}
   * @example <caption>Create an empty FetchXml</caption>
   * var fetch = new Fetch();
   * console.log(fetch.toString()); // outputs: <fetch><entity></entity></fetch>
   * @example <caption>Create a Fetch query for the "account"" entity, with 3 attributes and one filter</caption>
   * var fetch = new Fetch("account",["description","createdon","ownerid"],{name:"acme"});
   * @example <caption>Create a Fetch query for the "account"" entity, with all attributes and one filter</caption>
   * var fetch = new Fetch("account",true,{name:"acme"});
   */
  constructor(public entityName?: string, attr?: string | boolean | string[], filterConditions?) {
    if (this.attributes != undefined) this.setAttributes(attr);
    if (filterConditions != undefined) this.setFilter(filterConditions);
  }

  toString() {
    var xw = new XMLWriter(true);
    xw.startElement('fetch');
    xw.startElement('entity');
    if(this.entityName){
      xw.writeAttribute('name', this.entityName.toLowerCase());
    }
    this.serializeAttributes(this.attributes, xw);
    this.serializeConditions(this.filter, xw);
    xw.endDocument();
    return xw.toString();
  }

  private serializeAttributes(value: Array<string>, writer: XmlWriter): void {
    for (var i = 0; i < value.length; i++) {
      var attr = value[i].toLowerCase();
      if (attr == "*") {
        writer.startElement("all-attributes");
      }
      else {
        writer.startElement("attribute");
        writer.writeAttribute("name", attr);
      }
      writer.endElement();
    }
  }

/**
 * Sets the filter criteria of the current <i>FetchXml</i> with the specified values.
 * 
 * The specified value can be eiher a {@link Filter} object or a conditions object. 
 * 
 * A conditions object is a Javascript object where every property represents a condition.
 * 
 * If the object contains a property, and that property contains a simple value, like an string or a number, that means property equals to value.
 * 
 * If you need to specify another operator, then you have to use the form: {attribute:{$operator:value}}
 * 
 * If the value is an array, then the $in operator is used. 
 * 
 * If the value is a null value, then the nulloperator is applied. For example: {name:null} will retrieve all the records where the name is null.
 * 
 * @method Fetch#setFilter
 * @param filterCondition {Filter|object} A Filter object or a Conditions specified in JSON notation.
 * 
 * @see Build queries with FetchXML: {@link https://msdn.microsoft.com/en-us/library/gg328332.aspx}
 * 
 * @example <caption>When the simple syntax is used {name:value} then the $eq operator is used. The following filter retrieves all records where the attribute <i>name</i> is equals to "myAccount"</caption>
 * var cond = {name:"myAccount"};
 * @example <caption>The following retrieves all records where the attribute <i>name</i> is equals to "myAccount" <b>AND</b> the createdon date is equals to the system date</caption>
 * var cond = {name:"myAccount", createdon:new Date()}
 * @example <caption>If you need to specify additional operators, then use a subobject with the operator name. The following retrieves all records where the attribute <i>name</i> begins with "contoso%" and the attribute <i>createdon</i> is bigger than the current date</caption>
 * var cond = {name:{$like:"contoso%"}, createdon:{$bt:new Date()}}
 * @example <caption>Currently supported operators:</caption>
 * $eq, $neq, $gt, $ge, $le, $lt, $like, $notlLike, $in, $notIn, $between, $notBetween
 * @example <caption>If the value is an array, then the <i>in</i> operator is applied. The wollowing means: where name is one of contoso, acme or cycleworks</caption>
 * var cond = {name:["contoso", "acme", "cycleworks"]};
 * @example <caption>To specify the null operator, use a null value next to the attribute name. The following will retrieve all the records where the name is null.</caption>
 * var cond = {name:null};
 * @example <caption>To specify the Not Null operator, use a the "$notNull" value next to the attribute name. The following will retrieve all the records where the name is Not null.</caption>
 * var cond = {name:"$notNull"};
 */
  public setFilter(filterConditions) {
    if (filterConditions != null) {
      if (filterConditions instanceof Filter) {
        this.filter = filterConditions;
      }
      else {
        this.filter = this.convert(filterConditions);
      }
    }
  }

  public setAttributes(attributes: boolean | string | string[]) {
    if (attributes == null) {
      this.attributes = [];
    }
    else {
      if (Array.isArray(attributes)) {
        this.attributes = attributes;
      }
      else if (typeof attributes == "string") {
        this.attributes = [<string>attributes];
      }
      else if (typeof attributes == "boolean") {
        this.attributes = ["*"];
      }
    }
  }

  private serializeValue(value): string {
    var strValue = "";
    if (value !== null && value !== undefined) {
      if (value instanceof Date) {
        var dateValue = <Date>value;
        // TODO: Refactor this awful code
        var pad2 = x => String("00" + x).slice(-2);
        strValue = `${dateValue.getUTCFullYear()}-${pad2(dateValue.getUTCMonth())}-${pad2(dateValue.getUTCDate())} ${pad2(dateValue.getUTCHours())}:${pad2(dateValue.getUTCMinutes())}:${pad2(dateValue.getUTCSeconds())}`
      }
      else {
        strValue = value + "";
      }
    }
    return strValue;
  }

  private serializeConditions(filter: Filter, writer: XmlWriter): void {
    if (filter && filter.conditions && filter.conditions.length > 0) {

      var filterTypeName = FilterTypes[filter.filterType].toLowerCase();
      writer.startElement("filter").writeAttribute("type", filterTypeName);

      for (var i = 0; i < filter.conditions.length; i++) {
        var filterCondition = filter.conditions[i];
        var operatorName = this.operatorNames[filterCondition.operator];
        var attributeName = filterCondition.attribute.toLowerCase();

        writer.startElement("condition")
          .writeAttribute("attribute", attributeName)
          .writeAttribute("operator", operatorName);

        if (filterCondition.values && filterCondition.values.length > 0) {
          if (filterCondition.operator == Operators.In || filterCondition.operator == Operators.NotIn || filterCondition.values.length > 1) {
            for (var j = 0; j < filterCondition.values.length; j++) {
              var strValue = this.serializeValue(filterCondition.values[j]);
              writer.startElement("value").text(strValue).endElement();
            }
          }
          else {
            var strValue = this.serializeValue(filterCondition.values[0]);
            writer.writeAttribute("value", strValue);
          }
        }
        writer.endElement() // condition;
      }
      writer.endElement() // filter;
    }
  }

  private operatorNames: string[] = ['eq', 'neq', 'gt', 'ge', 'le', 'lt', 'like', 'not-like', 'in', 'not-in', 'between', 'not-between', 'null', 'not-null'];
  private operatorJsonNames: string[] = ['$eq', '$neq', '$gt', '$ge', '$le', '$lt', '$like', '$notlLike', '$in', '$notIn', '$between', '$notBetween', "",/*'null'*/, ""/*	'not-null'*/];
  private NOT_NULL_OPERATOR = "$notNull";

  private convert(conditionExpression): Filter {
    var filter = new Filter();
    for (var propName in conditionExpression) {
      var propValue = conditionExpression[propName];
      if (propValue == null) {
        filter.conditions.push(new Condition(propName, Operators.Null));
      }
      else if (propValue == this.NOT_NULL_OPERATOR) {
        filter.conditions.push(new Condition(propName, Operators.NotNull));
      }      
      else if (typeof propValue === 'number' || propValue instanceof Number || typeof propValue === 'string' || propValue instanceof String ||
        typeof propValue === 'boolean' || propValue instanceof Date) {
        filter.conditions.push(new Condition(propName, Operators.Equal, [propValue]));
      }
      else if (Array.isArray(propValue)) {
        filter.conditions.push(new Condition(propName, Operators.In, propValue));
      }
      else if (typeof propValue === 'object' && !(propValue instanceof Date)) {
        for (var i = 0; i < this.operatorJsonNames.length; i++) {
          var operatorName = this.operatorJsonNames[i];
          if (operatorName && propValue[operatorName] != undefined) {
            propValue = propValue[operatorName];
            if (Array.isArray(propValue)) {
              filter.conditions.push(new Condition(propName, i, propValue));
            }
            else {
              filter.conditions.push(new Condition(propName, i, [propValue]));
            }
            break;
          }
        }
      }
    }
    return filter;
  }
}

/**
 * Filter Type Values
 * @typedef {object} FilterTypes
 * @property {number} And Indicates that all the values in the conditions must be true
 * @property {number} Or Indicates that only one of the conditions must be true
 */
export enum FilterTypes { And, Or }


export class Filter {

  /**
   * Default Constructor
   * @class Filter
   * @classdesc Describes a Filter in a {@link Fetch} query.
   */

   /** @member Filter#conditions {Condition[]} Contains the conditions of this filter */
   /** @member Filter#filterType {FilterTypes} Indicates if the filter is an And or Or filter */

  constructor(public conditions?: Array<Condition>, public filterType?: FilterTypes) {
    if (this.conditions == null) this.conditions = new Array<Condition>();
    if (this.filterType == null) this.filterType = FilterTypes.And;
  }

}

// https://msdn.microsoft.com/en-us/library/gg309405.aspx
export enum Operators { Equal, NotEqual, GreaterThan, GreaterEqual, LessEqual, LessThan, Like, NotLike, In, NotIn, Between, NotBetween, Null, NotNull }
export class Condition {
  constructor(public attribute?: string, public operator?: Operators, public values?: Array<any>) {
  }
}
