import type { App, I18N, EventBus } from 'siyuan';

export const app = ref<App>({ plugins: [], appId: '' });

export const i18n = ref<I18N>({});

export const isMobile = ref<boolean>(false);

// Keep the host instance intact: Vue proxies cannot access EventBus private fields.
export const eventBus = shallowRef<EventBus>();

export const position = ref();
