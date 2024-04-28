<template>
  <select class="b3-select fn__flex-center fn__size200" v-model="position">
    <template v-for="{ value, text } in options" :key="value">
      <option :value="value">{{ text }}</option>
    </template>
  </select>
</template>
<script lang="ts" setup>
import { position, i18n } from '@/hooks/useSiYuan';
const { position: positionText } = i18n.value;
const options = ref([
  { value: 'top-left', text: positionText.topLeft },
  { value: 'top-right', text: positionText.topRight },
  { value: 'dock', text: positionText.dock },
]);
</script>
