import { useEffect, useState } from 'react';
import {
  ar,
  de,
  enUS,
  es,
  fr,
  he,
  hi,
  id as idLocale,
  it,
  ja,
  ko,
  nl,
  pl,
  ptBR,
  ru,
  sk,
  sr,
  th,
  tr,
  uk,
  vi,
  zhCN,
  zhTW,
  type Locale,
} from 'date-fns/locale';
import { getSystemConf } from '@/api/api';

const LOCALES: Record<string, Locale> = {
  ar,
  de,
  en: enUS,
  'en-US': enUS,
  es,
  fr,
  he,
  hi,
  id: idLocale,
  it,
  ja,
  ko,
  nl,
  pl,
  'pt-BR': ptBR,
  pt: ptBR,
  ru,
  sk,
  sr,
  th,
  tr,
  uk,
  vi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

export function resolveDateLocale(lang: string | undefined): Locale {
  if (!lang) {
    return enUS;
  }
  return LOCALES[lang] ?? LOCALES[lang.split('-')[0]] ?? enUS;
}

let cachedLocale: Locale | undefined;
let localeRequest: Promise<Locale> | undefined;

function loadLocale(): Promise<Locale> {
  if (cachedLocale) {
    return Promise.resolve(cachedLocale);
  }
  localeRequest ??= getSystemConf()
    .then((response) => {
      const lang = response?.conf.lang;
      if (!lang) {
        localeRequest = undefined;
        return enUS;
      }
      cachedLocale = resolveDateLocale(lang);
      return cachedLocale;
    })
    .catch(() => {
      localeRequest = undefined;
      return enUS;
    });
  return localeRequest;
}

export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(cachedLocale ?? enUS);

  useEffect(() => {
    let cancelled = false;
    void loadLocale().then((nextLocale) => {
      if (!cancelled) {
        setLocale(nextLocale);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return locale;
}
