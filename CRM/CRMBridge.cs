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
                ),
                Delete = (Func<object, Task<object>>)(
                    async (i) =>
                    {
                        return bridge.Delete(i);
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


        public object Delete(dynamic options)
        {
            //System.Diagnostics.Debugger.Break();

            // validate parameters
            if (options.id == null) throw new Exception("Id not specified");
            if (options.id.GetType() != typeof(string)) throw new Exception("Invalid Id type");
            if (options.entityName == null) throw new Exception("Entity Name not specified");
            if (options.entityName.GetType() != typeof(string)) throw new Exception("Invalid Entity Name type");
            if (string.IsNullOrWhiteSpace(options.entityName)) throw new Exception("Entity Name not specified");

            string entityName = options.entityName;
            entityName = entityName.ToLower(); // normalize casing
            Guid id = new Guid(options.id);

            _orgService.Delete(entityName, id);

            return null;
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
            entityName = entityName.ToLower(); // normalize casing
            object[] values = options.values;

            // convert the values to an entity type
            var entity = Convert(entityName, values);

            createdId = _orgService.Create(entity);

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
            entityName = entityName.ToLower(); // normalize casing
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

                // normalize column names casing
                for (int i = 0; i < cols.Length; i++) cols[i] = cols[i].ToLower();
                
                columns = new ColumnSet(cols);
            }


            Entity entityRecord = null;
            entityRecord = _orgService.Retrieve(entityName, id, columns);

            if (entityRecord != null) {
                result = Convert(entityRecord);
            }
            return result;
        }

        private Entity Convert(string entityName, object[] values)
        {

            var metadata = GetMetadataFromCache(entityName);
            var entity = new Entity(entityName);

            for (int i = 0; i < values.Length; i+=2)
            {
                string fieldName = (string)values[i];
                fieldName = fieldName.ToLower();// Normalize casing in field names
                object fieldValue = values[i + 1];
                AttributeMetadata fieldMetadata = Array.Find(metadata.Attributes, x => string.Compare(x.LogicalName,fieldName)==0);

                if (fieldMetadata != null)
                {
                    object fieldConvertedValue = Convert(fieldValue, fieldMetadata);
                    entity.Attributes.Add(fieldName.ToLower(), fieldConvertedValue);
                }
                else
                {
                    Console.WriteLine("Warning** attribute {0} not found in entity {1}",fieldName,entityName);
                }
            }

            return entity;
        }

        private object Convert(object fieldValue, AttributeMetadata fieldMetadata)
        {
            object convertedValue = null;

            switch (fieldMetadata.AttributeType)
            {
                case AttributeTypeCode.Memo:
                case AttributeTypeCode.String:
                    convertedValue = ConvertToString(fieldValue);
                    break;
                case AttributeTypeCode.Picklist:
                    convertedValue = ConvertToOptionSet(fieldValue);
                    break;
                default:
                    Console.WriteLine("Warning** Could not convert this value type: {0}", fieldMetadata.AttributeType);
                    break;
            }


            return convertedValue;
        }

        private OptionSetValue ConvertToOptionSet(object value)
        {
            return new OptionSetValue((int)value);
        }

        private string ConvertToString(object value)
        {
            return (string)value;
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



        private Dictionary<string, EntityMetadata> _metadataCache = new Dictionary<string, EntityMetadata>();
        private EntityMetadata GetMetadataFromCache(string entityName)
        {
            if (!_metadataCache.ContainsKey(entityName)) {
                _metadataCache.Add(entityName, GetMetadata(entityName));
            }
            return _metadataCache[entityName];
        }

        /// <summary>
        /// Retrieves an entity's metadata.
        /// </summary>
        /// <param name="entityName">entity's name</param>
        /// <returns>Attribute Metadata for the specified entity</returns>
        private EntityMetadata GetMetadata(string entityName)
        {
            RetrieveEntityRequest metaDataRequest = new RetrieveEntityRequest();
            RetrieveEntityResponse metaDataResponse = new RetrieveEntityResponse();
            metaDataRequest.EntityFilters = EntityFilters.All;
            metaDataRequest.LogicalName = entityName;
            metaDataResponse = (RetrieveEntityResponse)_orgService.Execute(metaDataRequest);

            return metaDataResponse.EntityMetadata;
        }
    }
