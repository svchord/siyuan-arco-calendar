import { request } from '@/api/api';
import { i18n } from './useSiYuan';

import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn';
import enUS from '@arco-design/web-vue/es/locale/lang/en-us';
import esES from '@arco-design/web-vue/es/locale/lang/es-es';
import jaJP from '@arco-design/web-vue/es/locale/lang/ja-jp';
import idID from '@arco-design/web-vue/es/locale/lang/id-id';
import frFR from '@arco-design/web-vue/es/locale/lang/fr-fr';
import ptPT from '@arco-design/web-vue/es/locale/lang/pt-pt';
import deDE from '@arco-design/web-vue/es/locale/lang/de-de';
import koKR from '@arco-design/web-vue/es/locale/lang/ko-kr';
import itIT from '@arco-design/web-vue/es/locale/lang/it-it';
import thTH from '@arco-design/web-vue/es/locale/lang/th-th';
import viVN from '@arco-design/web-vue/es/locale/lang/vi-vn';

const locales: { [key: string]: typeof zhCN } = {
  zh_CN: zhCN,
  en_US: enUS,
  es_ES: esES,
  ja_JP: jaJP,
  id_ID: idID,
  fr_FR: frFR,
  pt_PT: ptPT,
  de_DE: deDE,
  ko_KR: koKR,
  it_IT: itIT,
  th_TH: thTH,
  vi_VN: viVN,
};

export function formatMsg(key: string) {
  const msg = i18n.value.msg;
  return `${msg.begin} ${msg[key]}`;
}

export function useLocale() {
  const localeType = ref('zh_CN');
  const locale = computed(() => {
    return locales[localeType.value] || zhCN;
  });

  (async () => {
    const data = await request('/api/system/getConf');
    localeType.value = data.conf.lang;
  })();

  return { localeType, locale };
}
