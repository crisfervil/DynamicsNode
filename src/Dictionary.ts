export class KeyValuePair<T>{
    key:string;
    value:T;
}

export class Dictionary<T>{
    private _items:Array<KeyValuePair<T>>;
    
    constructor(){
        this._items = new Array<KeyValuePair<T>>();
    }
    
    push(key,value){
        var ndx = this.indexOf(key);
        if(ndx>-1) this._items[ndx].value=value;
        else this._items.push({key:key,value:value});
    }
    
    indexOf(key:string){
        for (var i = 0; i < this._items.length; i++) {
            if(this._items[i].key===key) return i;
        }
        return -1;
    }
    
    exist(key:string){
        return this.indexOf(key) > -1;
    }
    
    getValue(index:number){
        return this._items[index].value;
    }
}