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
using System.Linq;
using System.Net;
using System.Reflection;
using System.Threading.Tasks;

public class Startup
{
    public async Task<object> Invoke(dynamic options)
    {
        string connectionString = options.connectionString;
        bool useFake = options.useFake;

        //foreach (var a in AppDomain.CurrentDomain.GetAssemblies()) Console.WriteLine(a.FullName);

        CRMBridge bridge = new CRMBridge(connectionString, useFake);
        return new
        {
            Retrieve = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Retrieve(i);
                }
            ),
            RetrieveMultiple = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.RetrieveMultiple((string)i);
                }
            ),
            Create = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Create(i);
                }
            ),
            Update = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Update(i);
                }
            ),
            Delete = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Delete(i);
                }
            ),
            Associate = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Associate(i);
                }
            ),
            Disassociate = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.Disassociate(i);
                }
            ),
            GetEntityMetadata = (Func<object, Task<object>>)(
                async (i) =>
                {
                    return bridge.GetEntityMetadata(i);
                }
            ),
            Execute = (Func<object, Task<object>>)(
                async (i) =>
                {
                    try
                    {
                        return bridge.Execute(i);
                    }catch(Exception ex)
                    {
                        throw new Exception(ex.Message + "\n" + ex.ToString());
                    }
                }
            )
        };
    }
}


public class CrmService : IOrganizationService
{
    string _connectionString;
    CrmConnection _connection;
    OrganizationService _orgService;

    public CrmService(string connectionString)
    {
        WebRequest.DefaultWebProxy = WebRequest.GetSystemWebProxy();
        WebRequest.DefaultWebProxy.Credentials = CredentialCache.DefaultNetworkCredentials;
        _connectionString = connectionString;
        // Establish a connection to the organization web service using CrmConnection.
        _connection = Microsoft.Xrm.Client.CrmConnection.Parse(_connectionString);
        _orgService = new OrganizationService(_connection);
    }

    public OrganizationResponse Execute(OrganizationRequest request)
    {
        return _orgService.Execute(request);
    }

    public void Delete(string entityName, Guid id)
    {
        _orgService.Delete(entityName, id);
    }

    public void Associate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        _orgService.Associate(entityName, entityId, relationship, relatedEntities);
    }

    public Guid Create(Entity entity)
    {
        return _orgService.Create(entity);
    }

    public void Disassociate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        _orgService.Disassociate(entityName, entityId, relationship, relatedEntities);
    }

    public Entity Retrieve(string entityName, Guid id, ColumnSet columnSet)
    {
        return _orgService.Retrieve(entityName, id, columnSet);
    }

    public EntityCollection RetrieveMultiple(QueryBase query)
    {
        return _orgService.RetrieveMultiple(query);
    }

    public void Update(Entity entity)
    {
        _orgService.Update(entity);
    }
}

public class CRMBridge
{
    private IOrganizationService _service;
    private Dictionary<string, EntityMetadata> _metadataCache = new Dictionary<string, EntityMetadata>();

    public CRMBridge(string connectionString, bool useFake)
    {
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

    public object Create(dynamic options)
    {
        Guid createdId = Guid.Empty;

        string entityName = options.entityName;
        object[] values = options.values;

        // convert the values to an entity type
        var entity = Convert(entityName, values);

        createdId = _service.Create(entity);

        return createdId;
    }

    public object Update(dynamic options)
    {
        string entityName = options.entityName;
        object[] values = options.values;

        // convert the values to an entity type
        var entity = Convert(entityName, values);
        _service.Update(entity);

        return null;
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

    public object GetEntityMetadata(dynamic options)
    {
        var entityName = options.entityName;
        var metadata = GetMetadataFromCache(entityName);
        var res = Newtonsoft.Json.JsonConvert.SerializeObject(metadata);
        return res;
    }

    private Entity Convert(string entityName, object[] values)
    {

        var metadata = GetMetadataFromCache(entityName);
        var entity = new Entity(entityName);

        for (int i = 0; i < values.Length; i += 2)
        {
            string fieldName = (string)values[i];
            fieldName = fieldName.ToLower();// Normalize casing in field names
            object fieldValue = values[i + 1];
            AttributeMetadata fieldMetadata = Array.Find(metadata.Attributes, x => string.Compare(x.LogicalName, fieldName) == 0);

            if (fieldMetadata != null)
            {
                if (fieldMetadata.AttributeType != AttributeTypeCode.State && fieldMetadata.AttributeType != AttributeTypeCode.Status)
                {
                    object fieldConvertedValue = Convert(fieldValue, fieldMetadata);
                    entity.Attributes.Add(fieldName.ToLower(), fieldConvertedValue);
                }
                else
                {
                    Console.WriteLine("Warning** {0} attribute ignored. To change the status, use the SetStatus operation", fieldName);
                }
            }
            else
            {
                Console.WriteLine("Warning** attribute {0} not found in entity {1}", fieldName, entityName);
            }
        }

        return entity;
    }

    private object Convert(object fieldValue, AttributeMetadata fieldMetadata)
    {
        object convertedValue = null;

        switch (fieldMetadata.AttributeType)
        {
            case AttributeTypeCode.Picklist:
                convertedValue = ConvertToOptionSet(fieldValue, fieldMetadata);
                break;
            case AttributeTypeCode.Uniqueidentifier:
                convertedValue = ConvertToUniqueidentifier(fieldValue);
                break;
            case AttributeTypeCode.Customer:
                convertedValue = ConvertToCustomer(fieldValue);
                break;
            case AttributeTypeCode.DateTime:
                convertedValue = ConvertToDateTime(fieldValue);
                break;
            case AttributeTypeCode.Lookup:
                convertedValue = ConvertToLookup(fieldValue, fieldMetadata);
                break;
            default:
                // No conversion needed
                convertedValue = fieldValue;
                break;
        }


        return convertedValue;
    }

    private EntityReference ConvertToLookup(object fieldValue, AttributeMetadata fieldMetadata)
    {
        EntityReference lookupValue;

        var lookupMetadata = (LookupAttributeMetadata)fieldMetadata;
        if (lookupMetadata.Targets.Length > 1) throw new Exception("Too many targets");

        string targetEntityName = lookupMetadata.Targets[0];

        Guid guidValue;

        if (Guid.TryParse((string)fieldValue, out guidValue))
        {
            // Is a Guid
        }
        else
        {
            // Is a text, or something else, so we have to get its Id

            EntityMetadata targetEntityMetadata = GetMetadataFromCache(targetEntityName);
            var primaryNameAttribute = targetEntityMetadata.PrimaryNameAttribute;
            var targetEntityIdFieldName = targetEntityMetadata.PrimaryIdAttribute;
            QueryExpression qry = new QueryExpression(targetEntityName);
            qry.Criteria.AddCondition(new ConditionExpression(primaryNameAttribute, ConditionOperator.Equal, fieldValue));
            var lookupRecords = _service.RetrieveMultiple(qry);
            if (lookupRecords.Entities.Count == 0) throw new Exception("no records found");
            if (lookupRecords.Entities.Count > 1) throw new Exception("more than one record found");
            guidValue = (Guid)lookupRecords.Entities[0].Attributes[targetEntityIdFieldName];

        }
        lookupValue = new EntityReference(targetEntityName, guidValue);
        return lookupValue;
    }

    private object ConvertToDateTime(object fieldValue)
    {
        if (fieldValue.GetType() == typeof(DateTime))
        {
            return fieldValue;
        }
        else
        {
            return DateTime.Parse((string)fieldValue);
        }
    }

    private Guid ConvertToUniqueidentifier(object value)
    {
        return Guid.Parse((string)value);
    }

    private EntityReference ConvertToCustomer(dynamic value)
    {
        string id = (string)value.id;
        var guid = new Guid(id);
        string customerType = value.type;
        return new EntityReference(customerType,guid);
    }


    private OptionSetValue ConvertToOptionSet(object value, AttributeMetadata fieldMetadata)
    {
        OptionSetValue optionsetValue;
        int intValue = default(int);

        if (value.GetType() == typeof(int))
        {
            intValue = (int)value;
        }
        else
        {
            var found = false;
            // try to get the optionset value from a string
            PicklistAttributeMetadata optionsetMetadata = (PicklistAttributeMetadata)fieldMetadata;
            foreach (var optionMetadata in optionsetMetadata.OptionSet.Options)
            {
                if (optionMetadata.Label.UserLocalizedLabel.Label == (string)value)
                {
                    intValue = optionMetadata.Value.Value;
                    found = true;
                    break;
                }
            }
            if (!found) throw new Exception("Optionset value nor found");
        }

        optionsetValue = new OptionSetValue(intValue);
        return optionsetValue;
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

    private EntityMetadata GetMetadataFromCache(string entityName)
    {
        if (!_metadataCache.ContainsKey(entityName))
        {
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
        metaDataRequest.EntityFilters = EntityFilters.All;
        metaDataRequest.LogicalName = entityName;
        RetrieveEntityResponse metaDataResponse = (RetrieveEntityResponse)_service.Execute(metaDataRequest);

        return metaDataResponse.EntityMetadata;
    }

    public object Execute(dynamic request)
    {
        OrganizationRequest objRequest = ConvertFromDynamic(request);
        OrganizationResponse response = _service.Execute(objRequest);

        if (response != null && response.GetType() == typeof(WhoAmIResponse))
        {
            var rs = (WhoAmIResponse)response;
            return new { UserId = rs.UserId, BusinessUnitId = rs.BusinessUnitId, OrganizationId = rs.OrganizationId };
        }

        //Console.WriteLine("after execute");
        return response;
    }

    private Assembly GetAssembly(string name)
    {
        var assembly = AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(x => x.GetName().Name==name);
        return assembly;
    }

    private object ConvertFromDynamic(ExpandoObject value)
    {
        object converted = null;
        var valueDictionary = (IDictionary<string, object>)value;
        string typeName = (string)valueDictionary["__typeName"];

        if (string.IsNullOrEmpty(typeName)) throw new Exception("Class Type Name not specified");

        converted = GetTypeInstance(typeName);
        Type convertedType = converted.GetType();

        foreach (var prop in valueDictionary)
        {
            if (prop.Value != null)
            {
                var propDef = convertedType.GetProperty(prop.Key);
                if (propDef != null)
                {
                    var propValue = prop.Value;
                    Type propValueType = prop.Value.GetType();
                    if (propValueType == typeof(ExpandoObject))
                    {
                        ExpandoObject propExpando = (ExpandoObject)propValue;
                        propValue = ConvertFromDynamic(propExpando);
                    }
                    else if (propDef.PropertyType == typeof(Guid) && propValueType == typeof(string))
                    {
                        propValue = new Guid((string)propValue);
                    }
                    propDef.SetValue(converted, propValue);
                }
            }
        }

        return converted;
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


/// <summary>
/// Fake CRM connection for testing purposes
/// </summary>
public class FakeService : IOrganizationService
{
    private string _connectionString;
    public FakeService(string connectionString)
    {
        _connectionString = connectionString;
    }

    public OrganizationResponse Execute(OrganizationRequest request)
    {
        OrganizationResponse res = null;
        if (request != null)
        {
            if (request.GetType() == typeof(WhoAmIRequest))
            {
                if (_connectionString == "INCORRECT_CONNECTION_STRING") throw new Exception("incorrect connection string");
                res = new WhoAmIResponse();
                res["BusinessUnitId"] = new Guid("73174763-ed0e-4aeb-b02a-9f6dc078260a");
                res["OrganizationId"] = new Guid("73174763-ed0e-4aeb-b02a-9f6dc078260a");
                res["UserId"] = new Guid("73174763-ed0e-4aeb-b02a-9f6dc078260a");
            }
            else if (request.GetType() == typeof(RetrieveEntityRequest))
            {
                var em = new EntityMetadata() { SchemaName = "myEntity" };
                AttributeMetadata attr1 = (AttributeMetadata)typeof(AttributeMetadata).GetConstructor(BindingFlags.NonPublic | BindingFlags.CreateInstance | BindingFlags.Instance, null, new Type[] { typeof(AttributeTypeCode), typeof(string) }, null)
                                            .Invoke(new Object[] { AttributeTypeCode.Integer, "prop1" });
                attr1.LogicalName = "prop1";
                var attrs = new AttributeMetadata[] { attr1 };
                em.GetType().GetProperty("Attributes").SetValue(em, attrs);
                res = new RetrieveEntityResponse();
                res["EntityMetadata"] = em;
            }
        }
        return res;
    }

    public Guid Create(Entity entity)
    {
        return Guid.Empty;
    }

    public void Associate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
    }

    public void Delete(string entityName, Guid id)
    {
    }

    public void Disassociate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
    }

    public Entity Retrieve(string entityName, Guid id, ColumnSet columnSet)
    {
        throw new NotImplementedException();
    }

    public EntityCollection RetrieveMultiple(QueryBase query)
    {
        throw new NotImplementedException();
    }

    public void Update(Entity entity)
    {
    }
}