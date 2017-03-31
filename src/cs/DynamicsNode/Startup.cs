using System;
using System.Threading.Tasks;
using System.Linq;
using System.Reflection;

namespace DynamicsNode
{
    public class Startup
    {
        public async Task<object> Invoke(dynamic options)
        {
            try
            {
                string connectionString = options.connectionString;
                bool useFake = options.useFake;

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
                    Execute = (Func<object, Task<object>>)(
                        async (i) =>
                        {
                            return bridge.Execute(i);
                        }
                    )
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                throw ex;
            }
        }
    }
}