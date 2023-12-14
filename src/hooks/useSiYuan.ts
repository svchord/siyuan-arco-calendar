import { ref } from 'vue';
import type { App } from 'siyuan';

export const app = ref<App>({
    plugins: [],
    appId: ''
});

export const isMobile = ref<boolean>(false);
