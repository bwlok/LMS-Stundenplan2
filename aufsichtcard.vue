<template>
  <div>
    <q-scroll-area class="full-height q-pa-xs shadow-2 rounded-borders text-white bg-secondary">
      <div>Aufsicht {{ props.aufsichtinfo.ort }} {{ props.aufsichtinfo.zeit }}</div>
      <slot></slot>
    </q-scroll-area>
  </div>
</template>

<script setup>
const props = defineProps({
    aufsichtinfo: Object
});
</script>