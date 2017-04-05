using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Reflection;
using Microsoft.Crm.Sdk;

namespace DynamicsNode
{
    public class CRMBridge
    {
        private IOrganizationService _service;
        private Dictionary<string, EntityMetadata> _metadataCache = new Dictionary<string, EntityMetadata>();

        public CRMBridge(string connectionString, bool useFake)
        {
            // TODO: Fix this
            // This is to force .net framework to load the Microsoft.Crm.Sdk assembly
            var x = new WhoAmIRequest();

            if (useFake)
            {
                _service = new FakeService(connectionString);
            }
            else
            {
                _service = new CrmService(connectionString);
            }
        }

        public object Delete(dynamic options)
        {
            string entityName = options.entityName;
            Guid id = new Guid(options.id);

            _service.Delete(entityName, id);

            return null;
        }

        public object Create(dynamic entity)
        {
            Guid createdId = Guid.Empty;
            Entity e = ConvertFromDynamic(entity);
            createdId = _service.Create(e);
            return createdId;
        }

        public void Update(dynamic entity)
        {
            // convert the values to an entity type
            Entity e = ConvertFromDynamic(entity);
            _service.Update(e);
        }

        public object Retrieve(dynamic options)
        {
            object[] result = null;

            string entityName = options.entityName;
            Guid id = new Guid(options.id);
            ColumnSet columns = new ColumnSet(true);

            // convert the columns option to the right type
            if (options.columns.GetType() == typeof(bool))
            {
                columns = new ColumnSet((bool)options.columns);
            }
            else
            {
                string[] cols = new string[options.columns.Length];
                ((object[])options.columns).CopyTo(cols, 0);

                columns = new ColumnSet(cols);
            }

            Entity entityRecord = null;
            entityRecord = _service.Retrieve(entityName, id, columns);

            if (entityRecord != null)
            {
                result = Convert(entityRecord);
            }
            return result;
        }

        private QueryExpression FetchXmlToQueryExpression(string fetchXml)
        {
            return ((FetchXmlToQueryExpressionResponse)_service.Execute(new FetchXmlToQueryExpressionRequest() { FetchXml = fetchXml })).Query;

        }

        public object RetrieveMultiple(string fetchXml)
        {
            var result = new List<object>();

            // validate parameters
            if (fetchXml == null || string.IsNullOrWhiteSpace(fetchXml)) throw new Exception("fetchXml not specified");

            var query = FetchXmlToQueryExpression(fetchXml);
            var foundRecords = _service.RetrieveMultiple(query);

            if (foundRecords != null && foundRecords.Entities != null && foundRecords.Entities.Count > 0)
            {
                for (int i = 0; i < foundRecords.Entities.Count; i++)
                {
                    var record = foundRecords.Entities[i];
                    var convertedRecord = Convert(record);
                    result.Add(convertedRecord);
                }
            }

            return result.ToArray();
        }

        public object Associate(dynamic options)
        {
            string entityName = options.entityName;
            Guid entityId = new Guid(options.entityId);
            Relationship relationship = new Relationship(options.relationship);
            var relatedEntitiesList = new List<EntityReference>();
            foreach (var rel in options.relatedEntities)
            {
                relatedEntitiesList.Add(new EntityReference(rel.entityName, new Guid(rel.entityId)));
            }
            EntityReferenceCollection relatedEntities = new EntityReferenceCollection(relatedEntitiesList);
            _service.Associate(entityName, entityId, relationship, relatedEntities);

            return null;
        }

        public object Disassociate(dynamic options)
        {
            string entityName = options.entityName;
            Guid entityId = new Guid(options.entityId);
            Relationship relationship = new Relationship(options.relationship);
            var relatedEntitiesList = new List<EntityReference>();
            foreach (var rel in options.relatedEntities)
            {
                relatedEntitiesList.Add(new EntityReference(rel.entityName, new Guid(rel.entityId)));
            }
            EntityReferenceCollection relatedEntities = new EntityReferenceCollection(relatedEntitiesList);
            _service.Disassociate(entityName, entityId, relationship, relatedEntities);

            return null;
        }

        private object[] Convert(Entity entityRecord)
        {
            var values = new List<object>();
            string[] entityAttributes = new string[entityRecord.Attributes.Keys.Count];
            entityRecord.Attributes.Keys.CopyTo(entityAttributes, 0);

            for (int i = 0; i < entityAttributes.Length; i++)
            {
                string attributeName = entityAttributes[i];
                object attributeValue = entityRecord.Attributes[entityAttributes[i]];
                if (attributeValue.GetType() == typeof(EntityReference))
                {
                    var er = (EntityReference)attributeValue;
                    values.Add(new object[] { attributeName, er.Id });
                    values.Add(new object[] { string.Format("{0}_name", attributeName), er.Name });
                    values.Add(new object[] { string.Format("{0}_type", attributeName), er.LogicalName });
                }
                else if (attributeValue.GetType() == typeof(OptionSetValue))
                {
                    var os = (OptionSetValue)attributeValue;
                    values.Add(new object[] { attributeName, os.Value });
                    // Add attribute text from metadata
                }
                else
                {
                    values.Add(new object[] { attributeName, attributeValue });
                }
            }
            return values.ToArray();
        }

        public OrganizationResponse Execute(dynamic request)
        {
            OrganizationRequest objRequest = ConvertFromDynamic(request);
            OrganizationResponse response = _service.Execute(objRequest);
            return response;
        }

        private Assembly GetAssembly(string name)
        {
            var assembly = AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(x => string.Compare(x.GetName().Name,name,true)==0);

            if (assembly == null)
            {
                // TODO: Try to load the assembly from a file
            }

            return assembly;
        }

        private object ConvertFromDynamic(ExpandoObject value)
        {
            object converted = null;
            var valueDictionary = (IDictionary<string, object>)value;
            string typeName = (string)valueDictionary["__typeName"];

            if (string.IsNullOrEmpty(typeName)) throw new Exception("Type Name not specified");

            // Convert from a simple object
            if (typeName==typeof(Guid).FullName)
            {
                string propValue = (string)valueDictionary["Value"];
                converted = new Guid(propValue);
            }
            else if (typeName == typeof(Decimal).FullName)
            {
                object propValue = valueDictionary["Value"];
                converted = System.Convert.ToDecimal(propValue);
            }
            else
            {
                // Create an instance of the object to return
                converted = GetTypeInstance(typeName);
                Type convertedType = converted.GetType();

                foreach (var prop in valueDictionary)
                {
                    if (prop.Value != null)
                    {
                        var propDef = convertedType.GetProperty(prop.Key);
                        if (propDef != null)
                        {
                            object propValue = prop.Value;
                            Type propValueType = prop.Value.GetType();
                            if (propDef.PropertyType == typeof(AttributeCollection))
                            {
                                if (propValueType != typeof(ExpandoObject)) throw new Exception(string.Format("Can't convert from {0} to AttributeCollection", propValueType.Name));
                                propValue = ConvertFromDynamicToAttributeCollection((ExpandoObject)propValue);
                            }
                            else if (propValueType == typeof(ExpandoObject))
                            {
                                var propExpando = (ExpandoObject)propValue;
                                propValue = ConvertFromDynamic(propExpando);
                            }
                            else if (propValueType.IsArray)
                            {
                                propValue = ConvertFromArray((Array)prop.Value);
                            }
                            else if (propDef.PropertyType == typeof(Guid) && propValueType == typeof(string))
                            {
                                propValue = new Guid((string)propValue);
                            }
                            propDef.SetValue(converted, propValue);
                        }
                    }
                }
            }

            return converted;
        }

        private AttributeCollection ConvertFromDynamicToAttributeCollection(ExpandoObject value)
        {
            AttributeCollection retVal = null;
            if (value != null)
            {
                var valueDictionary = (IDictionary<string, object>)value;
                if (valueDictionary.Keys.Count > 0) retVal = new AttributeCollection();
                foreach (var prop in valueDictionary)
                {
                    object convertedValue = prop.Value;
                    if (prop.Value != null)
                    {
                        // Convert values
                        var propValueType = prop.Value.GetType();

                        if (propValueType == typeof(ExpandoObject))
                        {
                            convertedValue = ConvertFromDynamic((ExpandoObject)prop.Value);
                        }
                        else if (propValueType.IsArray)
                        {
                            convertedValue = ConvertFromArray((Array)prop.Value);
                        }
                        else if (propValueType == typeof(string))
                        {
                            Guid guidValue;
                            if (Guid.TryParse((string)prop.Value, out guidValue))
                            {
                                convertedValue = guidValue;
                            }
                        }
                    }
                    retVal.Add(prop.Key, convertedValue);
                }
            }
            return retVal;
        }

        private object ConvertFromArray(Array arrayToConvert)
        {
            object retVal = null;

            if (arrayToConvert != null)
            {
                var convertedItems = new List<object>();

                Type lastItemType = null;
                bool sameTypeArray = true;
                foreach (var item in arrayToConvert)
                {
                    object convertedValue = null;
                    if (item != null)
                    {
                        if (item.GetType() != typeof(ExpandoObject)) throw new Exception("The element in the array is not an ExpandoObject.Check the PartyList attributes in your entity");
                        var expandoItem = (ExpandoObject)item;
                        convertedValue = ConvertFromDynamic(expandoItem);
                        if (convertedValue != null)
                        {
                            if (lastItemType != null && lastItemType != convertedValue.GetType()) sameTypeArray = false;
                            lastItemType = convertedValue.GetType();
                        }
                    }
                    convertedItems.Add(convertedValue);
                }
                if (sameTypeArray && lastItemType != null)
                {
                    // If all the items in the array are ExpandoObjects and their underlying type is the same, then return a specific type array
                    retVal = Array.CreateInstance(lastItemType, convertedItems.Count);
                    Array.Copy(convertedItems.ToArray(), (Array)retVal, convertedItems.Count);
                }
                else
                {
                    retVal = convertedItems.ToArray();
                }
            }

            return retVal;
        }

        private object GetTypeInstance(string typeFullName)
        {
            object typeInstance;
            var typeNameParts = typeFullName.Split(',');
            string assemblyName = typeNameParts[0], className = typeNameParts[1];

            var assembly = GetAssembly(assemblyName);
            if (assembly == null) throw new Exception(string.Format("Can't find assembly '{0}'", assemblyName));
            typeInstance = assembly.CreateInstance(className);

            if (typeInstance == null) throw new Exception(string.Format("Can't create class of type '{0}'", typeFullName));
            return typeInstance;
        }
    }
}


