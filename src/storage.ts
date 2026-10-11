export interface Save { solo:number; coop:number; muted:boolean; reduced:boolean }
export const SAVE_KEY='vesper-breakers-v1';
export function parseSave(raw:string|null):Save {
 const defaults:Save={solo:0,coop:0,muted:false,reduced:false};
 try {
  const value:unknown=JSON.parse(raw??'null');
  if(!value||typeof value!=='object'||Array.isArray(value)) return defaults;
  const data=value as Record<string,unknown>;
  const score=(s:unknown)=>typeof s==='number'&&Number.isSafeInteger(s)&&s>=0&&s<=1e9?s:0;
  return {solo:score(data.solo),coop:score(data.coop),muted:data.muted===true,reduced:data.reduced===true};
 } catch { return defaults; }
}
export function loadSave(storage:Pick<Storage,'getItem'>):Save { try { return parseSave(storage.getItem(SAVE_KEY)); } catch { return parseSave(null); } }
export function writeSave(storage:Pick<Storage,'setItem'>,save:Save):boolean { try { storage.setItem(SAVE_KEY,JSON.stringify(save)); return true; } catch { return false; } }
