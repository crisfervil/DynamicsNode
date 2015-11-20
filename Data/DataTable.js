var DataTable = (function () {
    function DataTable() {
    }
    DataTable.prototype.lookup = function (columnName, updater) {
    };
    DataTable.prototype.save = function (fileName) {
    };
    DataTable.load = function (fileName) {
        return new DataTable();
    };
    return DataTable;
})();
exports.DataTable = DataTable;
