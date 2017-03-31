import { CRMClient } from './CRMClient';
import { SetBusinessSystemUserRequest, AddPrivilegesRoleRequest } from './Messages';
import { EntityReference, RolePrivilege } from "./CRMDataTypes";


export class SecurityUtil {

    static SetUserBusinessUnit(crm: CRMClient, userId: string, businessUnitId: string):void {

        var request = new SetBusinessSystemUserRequest();
        request.UserId = userId;
        request.BusinessId = businessUnitId;
        request.ReassignPrincipal = new EntityReference(userId, 'systemuser');

        crm.Execute(request);
    }

    static AddPrivileges(crm:CRMClient,roleName:string,privileges:RolePrivilege[]):void{

        var request = new AddPrivilegesRoleRequest();

        // get the role Id
        var role=crm.retrieve('role',{name:roleName,parentroleid:null},'roleid');
        if(role===null) throw new Error(`Role '${roleName}' not found`);

        var roleId = role.roleid;

        // Set the privilege id from their names
        for(var i=0;i<privileges.length;i++){
            var priv = privileges[i];
            if(!priv.PrivilegeId){ // If the ID wasn't specified
                // Get the privilege name
                var privInfo = crm.retrieve('privilege',{name:priv.Name},'privilegeid');
                if(!privInfo) throw new Error(`Privilege '${priv.Name}' not found. Provide the ID instead of the Name`);
                priv.PrivilegeId=privInfo.privilegeid;
            }
        }

        // set the typename property
        var sample = new RolePrivilege();
        for (var i = 0; i < privileges.length; i++) {
            privileges[i].__typeName=privileges[i].__typeName||sample.__typeName;
        }

        request.RoleId = roleId;
        request.Privileges = privileges;

        crm.Execute(request);
    }

}
