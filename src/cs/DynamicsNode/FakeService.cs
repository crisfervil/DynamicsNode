using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using System;
using System.Reflection;

namespace DynamicsNode
{
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
                    em.GetType().GetProperty("Attributes").SetValue((object)em, (object)attrs);
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
}