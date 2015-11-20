export class BusinessEntity
{

	constructor(public id?:string,public logicalName?:string,public attributes?:any[]) {
	}

	// Getter for the attributes
	// E.g.: entity.getValue('accountid') or contact.getValue('parentaccountid', 'name')
	getValue (attrname, opt_property) {

		var attr = this.attributes[attrname];

		if (attr) {

			var attrType = attr.type;

			switch (attrType) {

				case 'a:EntityReference':
					return (opt_property !== undefined) ? attr[opt_property] : attr.guid;

				case 'a:OptionSetValue':
					return (opt_property !== undefined) ? attr[opt_property] : attr.value;

				default:
					return attr.value;
			}
		}

		return null;
	};
}
