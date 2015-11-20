var BusinessEntity = (function () {
    function BusinessEntity(id, logicalName, attributes) {
        this.id = id;
        this.logicalName = logicalName;
        this.attributes = attributes;
    }
    BusinessEntity.prototype.getValue = function (attrname, opt_property) {
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
    ;
    return BusinessEntity;
})();
exports.BusinessEntity = BusinessEntity;
