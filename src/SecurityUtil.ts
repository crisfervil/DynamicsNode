import { CRMClient } from './CRMClient';
import { SetBusinessSystemUserRequest } from './Messages';
import {EntityReference} from "./CRMDataTypes";


export class SecurityUtil {

    static SetUserBusinessUnit(crm:CRMClient, userId:string, businessUnitId:string){
       
        var request = new SetBusinessSystemUserRequest();
        request.UserId = userId;
        request.BusinessId = businessUnitId;
        request.ReassignPrincipal = new EntityReference(userId,'systemuser');

        crm.Execute(request);
    }
    
}
