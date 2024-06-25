<template>
  <div class="q-ml-sm q-pa-xs rounded-borders" :class="changesclass" v-if="noetig">
    <div v-if="props.changes.caption" class="text-bold">{{ props.changes.caption }}</div>
    <div v-if="props.changes.message">{{ props.changes.message }}</div>
    <div v-if="props.changes.newRoomCodes">{{ props.changes.absentRoomCodes.join(', ') }} &rightarrow; {{ props.changes.newRoomCodes.join(',') }}</div>
    <div v-if="props.changes.newTeacherCodes">{{ props.changes.absentTeacherCodes.join(', ') }} &rightarrow; {{ props.changes.newTeacherCodes.join(',') }}</div>
  </div>
</template>

<script setup>
import {reactive, computed} from 'vue'

const emit = defineEmits(['onNoetigChange'])

const props = defineProps({
    changes: Object
})

const changesclass = reactive({
  'bg-negative' : props.changes.cancelled,
  'text-white'  : true,
  'bg-positive' : props.changes.changeType == 0, // Fällt aus
  'bg-secondary': props.changes.changeType == 1, // Raum fehlt
  'aenderung2'  : props.changes.changeType == 2, // Änderung 2
  'bg-info'     : props.changes.changeType == 3, // Zusatzunterricht
  'bg-orange'   : props.changes.changeType == 4, // Information
  'aenderung5'  : props.changes.changeType == 5, // Änderung 5
  'bg-accent'   : props.changes.changeType == 6, // Lehrer fehlt
  'aenderung7'  : props.changes.changeType == 7, // Änderung 7
  'bg-purple'   : props.changes.changeType == 8, // Klasse fehlt
})

const noetig = computed(() => {
  const noetigval = props.changes.caption || props.changes.message || props.changes.newRoomCodes || props.changes.newTeacherCodes;
  emit('onNoetigChange', !!noetigval)
  return noetigval
})
</script>