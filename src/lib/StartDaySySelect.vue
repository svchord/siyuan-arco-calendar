<template>
    <select class="b3-select fn__flex-center fn__size200" v-model="startDayOfWeek">
      <template v-for="{ value, text } in options" :key="value">
        <option :value="value">{{ text }}</option>
      </template>
    </select>
  </template>
  <script lang="ts" setup>
  import { startDayOfWeek, i18n } from '@/hooks/useSiYuan';
  const { startDayOfWeek: startDayOfWeekText } = i18n.value;
  const options = ref([
    { value: 'sun', text: startDayOfWeekText.sun },
    { value: 'mon', text: startDayOfWeekText.mon }
  ]);
  </script>
  