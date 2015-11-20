var BusinessEntity_1 = require("./BusinessEntity");
var SoapXmlParser = (function () {
    function SoapXmlParser() {
    }
    SoapXmlParser.getNodeText = function (node) {
        return node.text !== undefined ? node.text : node.textContent;
    };
    SoapXmlParser.getChildNode = function (xmlNode, nodeName) {
        var childNode;
        for (var i = 0, max = xmlNode.childNodes.length; i < max; i++) {
            childNode = xmlNode.childNodes[i];
            if (childNode.nodeName === nodeName) {
                return childNode;
            }
        }
    };
    SoapXmlParser.getAttribute = function (xmlNode, attrName) {
        var attr = null;
        for (var i = 0; i < xmlNode.attributes.length; i++) {
            attr = xmlNode.attributes[i];
            if (attr.name === attrName) {
                return attr.value;
            }
        }
    };
    SoapXmlParser.getChildNodeText = function (xml, xpathExpression) {
        return this.getNodeText(this.getChildNode(xml, xpathExpression));
    };
    SoapXmlParser.dateObjectFromUTCString = function (utcString) {
        var s = utcString.split(/\D/);
        return new Date(Date.UTC(+s[0], --s[1], +s[2], +s[3], +s[4], +s[5], 0));
    };
    SoapXmlParser.getEntityCollectionDetails = function (entityCollectionNode) {
        var entityName, moreRecords, pagingCookie, totalRecordCount, entitiesNode, collectionChildNode;
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
    };
    SoapXmlParser.parseAttibutes = function (attributesNode) {
        var typedAttrSet = {}, attrNode, key, type, value;
        for (var i = 0, max = attributesNode.childNodes.length; i < max; i++) {
            attrNode = attributesNode.childNodes[i];
            key = this.getChildNodeText(attrNode, 'b:key');
            value = this.getChildNode(attrNode, 'b:value');
            type = this.getAttribute(value, 'i:type');
            typedAttrSet[key] = this.xmlNodeToAttributeObject(type, value);
        }
        return typedAttrSet;
    };
    SoapXmlParser.parseSingleEntityNode = function (entityNode) {
        var entity = new BusinessEntity_1.BusinessEntity(), childSet, item, key, value;
        entity.id = this.getChildNodeText(entityNode, 'a:Id');
        entity.attributes = this.parseAttibutes(this.getChildNode(entityNode, 'a:Attributes'));
        entity.logicalName = this.getChildNodeText(entityNode, 'a:LogicalName');
        childSet = this.getChildNode(entityNode, 'a:FormattedValues').childNodes;
        for (var i = 0, max = childSet.length; i < max; i++) {
            item = childSet[i];
            key = this.getChildNodeText(item, 'b:key');
            value = this.getChildNodeText(item, 'b:value');
            entity.attributes[key].formattedValue = value;
        }
        return entity;
    };
    SoapXmlParser.getEntityCollection = function (entityCollectionNode) {
        var entitiesNode = this.getChildNode(entityCollectionNode, 'a:Entities').childNodes, collectionDetails = this.getEntityCollectionDetails(entityCollectionNode), entities = [];
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
    };
    SoapXmlParser.xmlNodeToAttributeObject = function (type, xmlnode) {
        var attr = {
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
                var aliasValue = this.getChildNode(xmlnode, 'a:Value'), aliasType = this.getAttribute(aliasValue, 'i:type');
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
    };
    SoapXmlParser.getRetrieveResult = function (responseXmlObject) {
        var executeResult = responseXmlObject.firstChild.firstChild.firstChild.firstChild, resultsNode = this.getChildNode(executeResult, 'a:Results'), singleEntityNode = this.getChildNode(resultsNode.firstChild, 'b:value');
        return this.parseSingleEntityNode(singleEntityNode);
    };
    SoapXmlParser.setPagingDetails = function (fetchxml, pageNumber, pagingCookie) {
        var serializer = new XMLSerializer(), parser = new DOMParser(), fetchDoc = parser.parseFromString(fetchxml, 'text/xml'), fetchElem = fetchDoc.getElementsByTagName('fetch')[0];
        fetchElem.setAttribute('page', pageNumber);
        fetchElem.setAttribute('paging-cookie', pagingCookie);
        return serializer.serializeToString(fetchDoc);
    };
    SoapXmlParser.getSoapError = function (soapXmlObject) {
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
    };
    SoapXmlParser.getFetchResult = function (responseXmlObject) {
        var executeResult = responseXmlObject.firstChild.firstChild.firstChild.firstChild, resultsNode = this.getChildNode(executeResult, 'a:Results'), entityCollectionNode = this.getChildNode(resultsNode.firstChild, 'b:value');
        return this.getEntityCollection(entityCollectionNode);
    };
    return SoapXmlParser;
})();
exports.SoapXmlParser = SoapXmlParser;
