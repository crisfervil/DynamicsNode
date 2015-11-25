using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Client;
using Microsoft.Xrm.Client.Services;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
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
                ),
                Create = (Func<object, Task<object>>)(
                    async (i) =>
                    {
                        return bridge.Create(i);
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


        public object Create(dynamic options)
        {
            //System.Diagnostics.Debugger.Break();
            Guid createdId = Guid.Empty;

            // validate parameters
            if (options.entityName == null) throw new Exception("Entity Name not specified");
            if (options.entityName.GetType() != typeof(string)) throw new Exception("Invalid Entity Name type");
            if (string.IsNullOrWhiteSpace(options.entityName)) throw new Exception("Entity Name not specified");
            if (options.values == null) throw new Exception("Values not specified");
            if (options.values.GetType() != typeof(object[])) throw new Exception("Invalid Values type");

            string entityName = options.entityName;
            object[] values = options.values;

            // convert the values to an entity type
            var entity = Convert(values);
            entity.LogicalName = entityName;

            var attributes = GetAttributes(entityName);

            return createdId;
        }

  
        public object Retrieve(dynamic options) {

            //System.Diagnostics.Debugger.Break();

            object[,] result = null;

            // validate parameters
            if (options.id == null) throw new Exception("Id not specified");
            if (options.id.GetType() != typeof(string)) throw new Exception("Invalid Id type");
            if (options.columns == null) throw new Exception("Columns not specified");
            if (options.columns.GetType() != typeof(object[]) && options.columns.GetType() != typeof(bool)) throw new Exception("Invalid Columns type");
            if (options.entityName == null) throw new Exception("Entity Name not specified");
            if (options.entityName.GetType() != typeof(string)) throw new Exception("Invalid Entity Name type");
            if (string.IsNullOrWhiteSpace(options.entityName)) throw new Exception("Entity Name not specified");

            string entityName = options.entityName;
            Guid id = new Guid(options.id);
            ColumnSet columns = new ColumnSet(true);

            // convert the columns option to the right type
            if (options.columns.GetType() == typeof(bool))
            {
                columns = new ColumnSet((bool)options.columns);
            }
            else if (options.columns.GetType() == typeof(object[]))
            {
                string[] cols = new string[options.columns.Length];
                ((object[])options.columns).CopyTo(cols, 0);
                columns = new ColumnSet(cols);
            }

            Entity entityRecord = null;
            entityRecord = _orgService.Retrieve(entityName, id, columns);

            if (entityRecord != null) {
                result = Convert(entityRecord);
            }
            return result;
        }

        private Entity Convert(object[] values)
        {
            var entity = new Entity();

            for (int i = 0; i < values.Length; i+=2)
            {
                // TODO: Cast to the right data type
                entity.Attributes.Add((string)values[i], values[i + 1]);
            }

            return entity;
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


        /// <summary>
        /// Retrieves an entity's attributes.
        /// </summary>
        /// <param name="_entityName">entity's name</param>
        /// <returns>Attribute Metadata for the specified entity</returns>
        private AttributeMetadata[] GetAttributes(string _entityName)
        {
            RetrieveEntityRequest metaDataRequest = new RetrieveEntityRequest();
            RetrieveEntityResponse metaDataResponse = new RetrieveEntityResponse();
            metaDataRequest.EntityFilters = EntityFilters.Attributes;
            metaDataRequest.LogicalName = _entityName;
            metaDataResponse = (RetrieveEntityResponse)_orgService.Execute(metaDataRequest);

            return metaDataResponse.EntityMetadata.Attributes;
        }
    }
