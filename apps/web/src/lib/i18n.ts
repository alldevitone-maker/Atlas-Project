import { I18n } from '../../../../packages/i18n/src/index';
export type Catalog = Record<string, string>;
export function translator(catalog: Catalog) {
  const i18n = new I18n({active:catalog},'active');
  return (key:string,vars:Record<string,string | number>={})=>i18n.t(key,vars);
}
