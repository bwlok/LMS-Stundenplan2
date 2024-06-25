<template>
  <div>
    <q-scroll-area class="full-height q-pa-xs shadow-2 rounded-borders" :class="eventclass" @click="logEvent">
      <div>{{ eventinfo.start.format('HH:mm') }} - {{ eventinfo.end.format('HH:mm') }}</div>
      <changes ref="changesdiv" v-if="eventinfo.changes" :changes="eventinfo.changes" @onNoetigChange="(v) => noetig=v"/>
      <div class="text-bold">
        {{ eventinfo.courseTitle }}
        {{eventinfo.classCodes ? eventinfo.classCodes.join(', ') : ''}}
        {{eventinfo.teacherCodes ? eventinfo.teacherCodes.join(', ') : ''}}</div>
      <div v-if="eventinfo.roomCodes">{{eventinfo.roomCodes.join(', ')}}</div>
      <div v-if="eventinfo.periodCode">{{ eventinfo.periodCode }}</div>
      <div v-if="courseinfo && courseinfo.remarks">{{ courseinfo.remarks }}</div>
      <slot></slot>
    </q-scroll-area>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import changes from 'changes.vue'

const props = defineProps({
    eventinfo: Object,
    courseinfo: Object
});

const noetig = ref(false)

const eventclass = computed(() => {
  return{
    'bg-primary': !props.eventinfo.changes,
    'bg-warning': !!props.eventinfo.changes && noetig.value,
    'bg-blue-4': !!props.eventinfo.changes && !noetig.value,
    'text-white': true,
  }
})

function logEvent() {
  console.log(props.eventinfo)
  console.log(props.courseinfo)
}
</script>
