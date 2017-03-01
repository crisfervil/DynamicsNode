import {CRMClient} from './CRMClient';
import {EntityMetadata,EntityFilters,AttributeMetadata,OptionsetMetadata} from './CRMDataTypes';
import {RetrieveEntityRequest,RetrieveEntityResponse} from './Messages';

export class MetadataUtil {
    
    private static _metadataCache = {};

    static getEntityMetadataFromCrm(crm:CRMClient, entityName: string): EntityMetadata {
        var request = new RetrieveEntityRequest(entityName, EntityFilters.All);
        var response: RetrieveEntityResponse = crm.Execute(request);
        return response.EntityMetadata;
    }

    static getEntityMetadata(crm:CRMClient, entityName: string): EntityMetadata {
        if(this._metadataCache[entityName]===undefined){
            var metadata = this.getEntityMetadataFromCrm(crm,entityName);
            this._metadataCache[entityName] = metadata;
        }
        return this._metadataCache[entityName];
    }

    static getAttributeMetadata(crm:CRMClient, entityName: string, attributeName: string): AttributeMetadata {
        
        var attributeMetadata: AttributeMetadata = null;
        var entityMetadata = this.getEntityMetadata(crm,entityName);
        
        if (entityMetadata && entityMetadata.Attributes && entityMetadata.Attributes.length > 0) {

            for (var i = 0; i < entityMetadata.Attributes.length; i++) {
                if (entityMetadata.Attributes[i].LogicalName == attributeName) {
                    attributeMetadata = entityMetadata.Attributes[i];
                    break;
                }
            }

            // In case there isn't an attribute with the specified name, then try to find it by displayname
            if(attributeMetadata===null) {
                for (var i = 0; i < entityMetadata.Attributes.length; i++) {
                    if (entityMetadata.Attributes[i].DisplayName!=null&&
                        entityMetadata.Attributes[i].DisplayName.UserLocalizedLabel!=null&&
                        entityMetadata.Attributes[i].DisplayName.UserLocalizedLabel.Label!=null&&
                        entityMetadata.Attributes[i].DisplayName.UserLocalizedLabel.Label.toLowerCase()==attributeName.toLowerCase()) {
                        attributeMetadata = entityMetadata.Attributes[i];
                        break;
                    }
                }                
            }
        }
        return attributeMetadata;
    }

    /** Gets the optionset number value from its label value. If not found returns null */
    static getOptionsetValue(crm:CRMClient, entityName:string, attributeName:string, optionsetText:string):number{
        var optionsetValue:number = null;

        var attribute = this.getAttributeMetadata(crm,entityName,attributeName);
        if(attribute===null) throw new Error(`Attribute ${attributeName} not found in entity '${entityName}'`);

        var options = (<OptionsetMetadata>attribute.OptionSet).Options;
        for(var i=0;i<options.length;i++){
            var option=options[i];
            if(option && option.Label && option.Label.UserLocalizedLabel && option.Label.UserLocalizedLabel.Label &&
                option.Label.UserLocalizedLabel.Label===optionsetText){
                optionsetValue=option.Value;
                break;
            }            
        }

        return optionsetValue;
    }
}
