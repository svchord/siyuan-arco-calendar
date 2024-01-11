import { ref } from 'vue';
import type { App, EventBus } from 'siyuan';

export const app = ref<App>({
  plugins: [],
  appId: '',
});

export const isMobile = ref<boolean>(false);

export const eventBus = ref<EventBus>();
