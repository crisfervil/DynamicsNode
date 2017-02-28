
import { CRMClient } from './CRMClient';
import { SetStateRequest} from './Messages';
import {EntityReference,OptionSetValue} from './CRMDataTypes';

export class StateUtil {
    static setState(client:CRMClient, entityName:string, entityId:string, state:number|string, status:number|string){

        var request = new SetStateRequest();
        request.EntityMoniker = new EntityReference(entityId,entityName);
        request.State = new OptionSetValue(<number>state);
        request.Status = new OptionSetValue(<number>status);
        client.Execute(request);
    }
}