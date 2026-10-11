import {expect,it} from 'vitest';
import {parseSave} from '../src/storage';
it('rejects corrupt storage and validates fields independently',()=>{
 expect(parseSave('{bad')).toEqual({solo:0,coop:0,muted:false,reduced:false});
 expect(parseSave('{"solo":500,"coop":-3,"muted":"false","reduced":true}')).toEqual({solo:500,coop:0,muted:false,reduced:true});
});
