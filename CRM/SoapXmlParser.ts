import {BusinessEntity} from "./BusinessEntity";

export class SoapXmlParser
{
	private static getNodeText(node) {

		return node.text !== undefined ? node.text : node.textContent;
	}

	// get a single child node that matches the specified name.
	private static getChildNode(xmlNode, nodeName) {

		var childNode;

		for (var i = 0, max = xmlNode.childNodes.length; i < max; i++) {

			childNode = xmlNode.childNodes[i];

			if (childNode.nodeName === nodeName) {
				return childNode;
			}
		}
	}

	// Get the attribute regardless of the namespace
	private static getAttribute(xmlNode, attrName) {

		var attr = null;

		for (var i = 0; i < xmlNode.attributes.length; i++) {

			attr = xmlNode.attributes[i];

			if (attr.name === attrName) {
				return attr.value;
			}
		}
	}

	// retrievs the text-value of the expression
	private static getChildNodeText(xml, xpathExpression) {
		return this.getNodeText(this.getChildNode(xml, xpathExpression));
	}

	// parses a date-string in ISO-format into a date-object
	private static dateObjectFromUTCString(utcString) {

		var s = utcString.split(/\D/);
		return new Date(Date.UTC(+s[0], --s[1], +s[2], +s[3], +s[4], +s[5], 0));
	}

	// extracts the entity-name, totalrecord count, etc.
	// form the entity-collection xml-node
	private static getEntityCollectionDetails(entityCollectionNode) {

		var entityName, moreRecords, pagingCookie,
			totalRecordCount, entitiesNode, collectionChildNode;

		// Try to get all child nodes in one pass
		for (var m = 0; m < entityCollectionNode.childNodes.length; m++) {

			collectionChildNode = entityCollectionNode.childNodes[m];

			switch (collectionChildNode.nodeName) {

				case "a:EntityName":
					entityName = this.getNodeText(collectionChildNode);
					break;
				case "a:MoreRecords":
					moreRecords = this.getNodeText(collectionChildNode) === "true";
					break;
				case "a:PagingCookie":
					pagingCookie = this.getNodeText(collectionChildNode);
					break;
				case "a:TotalRecordCount":
					totalRecordCount = parseInt(this.getNodeText(collectionChildNode), 10);
					break;
				case "a:Entities":
					entitiesNode = collectionChildNode;
					break;
			}
		}

		return {
			entityName: entityName,
			moreRecords: moreRecords,
			pagingCookie: pagingCookie,
			totalRecordCount: totalRecordCount
		};
	}

	// parses "Attribute" nodes of the SOAP-response
	private static parseAttibutes(attributesNode) {

		var typedAttrSet:any = {},
			attrNode, key, type, value;

		for (var i = 0, max = attributesNode.childNodes.length; i < max; i++) {

			attrNode = attributesNode.childNodes[i];

			// Establish the key for the attribute
			key = this.getChildNodeText(attrNode, 'b:key');
			value = this.getChildNode(attrNode, 'b:value');
			type = this.getAttribute(value, 'i:type');

			// populate the object
			typedAttrSet[key] = this.xmlNodeToAttributeObject(type, value);
		}

		return typedAttrSet;
	}

	// Parses a single xml-node -> transforms into BusinessEntity
	private static parseSingleEntityNode(entityNode) {

		var entity = new BusinessEntity(),
			childSet, item, key, value;

		entity.id = this.getChildNodeText(entityNode, 'a:Id');
		entity.attributes = this.parseAttibutes(this.getChildNode(entityNode, 'a:Attributes'));
		entity.logicalName = this.getChildNodeText(entityNode, 'a:LogicalName');

		// parse the formated values
		childSet = this.getChildNode(entityNode, 'a:FormattedValues').childNodes;

		for (var i = 0, max = childSet.length; i < max; i++) {

			item = childSet[i];
			key = this.getChildNodeText(item, 'b:key');
			value = this.getChildNodeText(item, 'b:value');

			entity.attributes[key].formattedValue = value;
		}

		return entity;
	}

	// get a list of entities from an attr of type 'EntityCollection'
	// e.g. 'Party Lists'
	private static getEntityCollection(entityCollectionNode) {

		var entitiesNode = this.getChildNode(entityCollectionNode, 'a:Entities').childNodes,
			collectionDetails = this.getEntityCollectionDetails(entityCollectionNode),
			entities = [];

		for (var i = 0, max = entitiesNode.length; i < max; i++) {
			entities.push(this.parseSingleEntityNode(entitiesNode[i]));
		}

		return {
			entityName: collectionDetails.entityName,
			moreRecords: collectionDetails.moreRecords,
			pagingCookie: collectionDetails.pagingCookie,
			totalRecordCount: collectionDetails.totalRecordCount,
			entities: entities
		};
	}

	// Converst the xml definiton into an attribute object.
	// The joined attributes are evaluated via a recursive call of this function
	private static xmlNodeToAttributeObject(type, xmlnode) {

		var attr:any = {
			'type': type
		};

		switch (type) {

			case "a:OptionSetValue":
				attr.value = parseInt(this.getNodeText(xmlnode), 10);
				break;

			case "a:EntityReference":
				attr.guid = this.getChildNodeText(xmlnode, 'a:Id');
				attr.name = this.getChildNodeText(xmlnode, 'a:Name');
				attr.logicalName = this.getChildNodeText(xmlnode, 'a:LogicalName');
				break;

			case "a:EntityCollection":
				attr.value = this.getEntityCollection(xmlnode);
				break;

			case "a:Money":
				attr.value = parseFloat(this.getNodeText(xmlnode));
				break;

			case "a:AliasedValue":

				var aliasValue = this.getChildNode(xmlnode, 'a:Value'),
					aliasType = this.getAttribute(aliasValue, 'i:type');

				// recursive call
				attr = this.xmlNodeToAttributeObject(aliasType, aliasValue);
				break;

			case 'c:int':
				attr.value = parseInt(this.getNodeText(xmlnode), 10);
				break;

			case 'c:decimal':
				attr.value = parseFloat(this.getNodeText(xmlnode));
				break;

			case 'c:dateTime':
				attr.value = this.dateObjectFromUTCString(this.getNodeText(xmlnode));
				break;

			case 'c:boolean':
				attr.value = (this.getNodeText(xmlnode) !== 'true') ? false : true;
				break;

			default:
				attr.value = this.getNodeText(xmlnode);
				break;
		}

		return attr;
	}

	static getRetrieveResult(responseXmlObject) {

		var executeResult = responseXmlObject.firstChild.firstChild.firstChild.firstChild,
				resultsNode = this.getChildNode(executeResult, 'a:Results'),
				singleEntityNode = this.getChildNode(resultsNode.firstChild, 'b:value');

 		return this.parseSingleEntityNode(singleEntityNode);
	}

	// injects the paging-cookie & page-count
	static setPagingDetails(fetchxml, pageNumber, pagingCookie) {

		var serializer = new XMLSerializer(),
			parser = new DOMParser(),
			fetchDoc = parser.parseFromString(fetchxml, 'text/xml'),
			fetchElem = fetchDoc.getElementsByTagName('fetch')[0];

		fetchElem.setAttribute('page', pageNumber);
		fetchElem.setAttribute('paging-cookie', pagingCookie);

		return serializer.serializeToString(fetchDoc);
	}

	// extracts the error message generated by the Dynamics CRM server
	static getSoapError(soapXmlObject) {

		var bodyNode, faultNode, faultStringNode;

		try {
			bodyNode = soapXmlObject.firstChild.firstChild;
			faultNode = this.getChildNode(bodyNode, 's:Fault');
			faultStringNode = this.getChildNode(faultNode, 'faultstring');

			return this.getNodeText(faultStringNode);
		}
		catch (e) {
			return "An error occurred when parsing the error returned from CRM server: " + e.message;
		}
	}

	// converts the response to a result-object that contains the
	// entities, pagaingcookie...
	static getFetchResult(responseXmlObject) {

		// "s:Envelope/s:Body/ExecuteResponse/ExecuteResult"
		var executeResult = responseXmlObject.firstChild.firstChild.firstChild.firstChild,
			resultsNode = this.getChildNode(executeResult, 'a:Results'),
			entityCollectionNode = this.getChildNode(resultsNode.firstChild, 'b:value');

		return this.getEntityCollection(entityCollectionNode);
	}
}
