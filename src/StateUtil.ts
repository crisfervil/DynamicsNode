
import { Guid } from './Guid';
import { CRMClient } from './CRMClient';
import { SetStateRequest } from './Messages';
import { EntityReference, OptionSetValue, OptionsetMetadata } from './CRMDataTypes';
import { MetadataUtil } from './MetadataUtil';

export class StateUtil {
    static setState(crm:CRMClient, entityName:string, entityId:Guid|string, state:number|string, status:number|string){

        var idValue:string, stateValue:number, statusValue:number;


        idValue = entityId instanceof Guid ? entityId.toString(): entityId;         

        if(typeof state === 'string'){
            stateValue = MetadataUtil.getOptionsetValue(crm,entityName,'statecode',state);
            if(stateValue===null) throw new Error(`Couldn't find value '${state}' for statecode in entity '${entityName}'`);
        }
        else{
            stateValue=state;
        }

        if(typeof status === 'string'){
            statusValue = MetadataUtil.getOptionsetValue(crm,entityName,'statuscode',status);
            if(statusValue===null) throw new Error(`Couldn't find value '${status}' for statuscode in entity '${entityName}'`);
        }
        else{
            statusValue=status;
        }

        var request = new SetStateRequest();
        request.EntityMoniker = new EntityReference(idValue,entityName);
        request.State = new OptionSetValue(stateValue);
        request.Status = new OptionSetValue(statusValue);

        crm.Execute(request);
    }
}