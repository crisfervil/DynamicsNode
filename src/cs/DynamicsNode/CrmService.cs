using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Tooling.Connector;
using System;
using System.Net;

namespace DynamicsNode
{
    public class CrmService : IOrganizationService
    {
        string _connectionString;
        CrmServiceClient _connection;

        public CrmService(string connectionString)
        {
            WebRequest.DefaultWebProxy = WebRequest.GetSystemWebProxy();
            WebRequest.DefaultWebProxy.Credentials = CredentialCache.DefaultNetworkCredentials;
            _connectionString = connectionString;
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
}
