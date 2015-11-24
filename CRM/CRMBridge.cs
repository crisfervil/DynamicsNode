using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Threading.Tasks;


    public class Startup
    {
        public async Task<object> Invoke(string connectionString)
        {
            // Establish a connection to the organization web service using CrmConnection.
            CrmConnection connection = CrmConnection.Parse(connectionString);
            CRMBridge bridge = new CRMBridge(connection);
            return new {
                WhoAmI = (Func<object, Task<object>>)(
                    async (i) =>
                    {
                        return bridge.WhoAmI();
                    }
                ),
                Retrieve = (Func<object, Task<object>>)(
                    async (i) =>
                    {
                        return bridge.Retrieve(i);
                    }
                )
            };
        }
    }

    public class CRMBridge {
        CrmConnection _connection;
        OrganizationService _orgService;

        public string MyProperty { get; set; }

        public CRMBridge(CrmConnection connection) {
            MyProperty = "test";
            _connection = connection;
            _orgService = new OrganizationService(_connection);
        }

        public Guid WhoAmI()
        {
            return ((WhoAmIResponse)_orgService.Execute(new WhoAmIRequest())).UserId;
        }

        public object Retrieve(dynamic options) {

            System.Diagnostics.Debugger.Break();

            object[,] result = null;

            // validate parameters
            if (options.id == null) throw new Exception("Id not specified");
            
            Guid id = new Guid(options.id);
            ColumnSet columns;

            if (options.columns.GetType() == typeof(bool))
            {
                columns = new ColumnSet(true);
            }
            else if (options.columns.GetType() == typeof(object[]))
            {
                string[] cols = new string[options.columns.Length];
                ((object[])options.columns).CopyTo(cols, 0);
                columns = new ColumnSet(cols);
            }
            else
            {
                columns = new ColumnSet();
            }

            Entity entityRecord = null;
            
            entityRecord = _orgService.Retrieve(options.entityName, id, columns);
            if (entityRecord != null) {
                result = Convert(entityRecord);
            }
            return result;
        }

        private object[,] Convert(Entity entityRecord)
        {
            var values = new Dictionary<string, object>();
            string[] entityAttributes = new string[entityRecord.Attributes.Keys.Count];
            entityRecord.Attributes.Keys.CopyTo(entityAttributes, 0);

            for (int i = 0; i < entityAttributes.Length; i++)
            {
                string attributeName = entityAttributes[i];
                object attributeValue = entityRecord.Attributes[entityAttributes[i]];
                if (attributeValue.GetType() == typeof(EntityReference))
                {
                    var er = (EntityReference)attributeValue;
                    values[attributeName] = er.Id;
                    values[string.Format("{0}_name", attributeName)] = er.Name;
                    values[string.Format("{0}_type", attributeName)] = er.LogicalName;
                }
                else if (attributeValue.GetType() == typeof(OptionSetValue))
                {
                    var os = (OptionSetValue)attributeValue;
                    values[attributeName] = os.Value;
                }
                else
                {
                    values[attributeName] = attributeValue;
                }
            }

            var ndx = 0;
            var result = new object[values.Count,2];
            foreach (var item in values)
            {
                result[ndx,0] = item.Key;
                result[ndx,1] = item.Value;
                ndx++;
            }
            return result;
        }
    }


