using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Tooling.Connector;
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
        System.AppDomain.CurrentDomain.UnhandledException += (x, y) => {
            //Console.WriteLine(y.ExceptionObject.ToString());
        };
        System.AppDomain.CurrentDomain.FirstChanceException += (x, y) => {
            //Console.WriteLine(y.Exception.ToString());
        };

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
                    bridge.Update(i);
                    return null;
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
                    return bridge.Execute(i);
                }
            )
        };
    }
}


public class CrmService : IOrganizationService
{
    string _connectionString;
    CrmServiceClient _connection;

    public CrmService(string connectionString)
    {
        WebRequest.DefaultWebProxy = WebRequest.GetSystemWebProxy();
        WebRequest.DefaultWebProxy.Credentials = CredentialCache.DefaultNetworkCredentials;
        _connectionString = connectionString;
        // Establish a connection to the organization web service using CrmConnection.
        _connection = new CrmServiceClient(_connectionString);
    }

    public OrganizationResponse Execute(OrganizationRequest request)
    {
        return _connection.Execute(request);
    }

    public void Delete(string entityName, Guid id)
    {
        _connection.Delete(entityName, id);
    }

    public void Associate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        _connection.Associate(entityName, entityId, relationship, relatedEntities);
    }

    public Guid Create(Entity entity)
    {
        return _connection.Create(entity);
    }

    public void Disassociate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
    {
        _connection.Disassociate(entityName, entityId, relationship, relatedEntities);
    }

    public Entity Retrieve(string entityName, Guid id, ColumnSet columnSet)
    {
        return _connection.Retrieve(entityName, id, columnSet);
    }

    public EntityCollection RetrieveMultiple(QueryBase query)
    {
        return _connection.RetrieveMultiple(query);
    }

    public void Update(Entity entity)
    {
        _connection.Update(entity);
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

    public object GetEntityMetadata(dynamic options)
    {
        var entityName = options.entityName;
        var metadata = GetMetadataFromCache(entityName);
        var res = Newtonsoft.Json.JsonConvert.SerializeObject(metadata);
        return res;
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
        object response = _service.Execute(objRequest);

        if (response != null && response.GetType() == typeof(WhoAmIResponse))
        {
            var rs = (WhoAmIResponse)response;
            response = new
            { UserId = rs.UserId,
                BusinessUnitId = rs.BusinessUnitId,
                OrganizationId = rs.OrganizationId,
                ExtensionData = rs.ExtensionData,
                Results = rs.Results,
                ResponseName=rs.ResponseName };
        }
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
                    if (propDef.PropertyType == typeof(AttributeCollection))
                    {
                        if (propValueType != typeof(ExpandoObject)) throw new Exception(string.Format("Can't convert from {0} to AttributeCollection", propValueType.Name));
                        propValue = ConvertFromDynamicToAttributeCollection((ExpandoObject)propValue);
                    }
                    else if (propValueType == typeof(ExpandoObject))
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

    private AttributeCollection ConvertFromDynamicToAttributeCollection(ExpandoObject value)
    {
        AttributeCollection retVal = null;
        if (value != null)
        {
            var valueDictionary = (IDictionary<string, object>)value;
            if (valueDictionary.Keys.Count > 0) retVal = new AttributeCollection();
            foreach (var prop in valueDictionary)
            {
                if (prop.Value != null)
                {
                    // Convert values
                    object convertedValue = prop.Value;
                    var propValueType = prop.Value.GetType();

                    if(propValueType == typeof(ExpandoObject))
                    {
                        convertedValue = ConvertFromDynamic((ExpandoObject)prop.Value);
                    }
                    else if (propValueType == typeof(string))
                    {
                        Guid guidValue;
                        if(Guid.TryParse((string)prop.Value,out guidValue))
                        {
                            convertedValue = guidValue;
                        }
                    }
                    retVal.Add(prop.Key, convertedValue);
                }
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