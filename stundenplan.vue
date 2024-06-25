<template>
  <div style="min-width: 600px">
    <div class="row q-ma-md">
      <div class="col">
        <div class="lms-title" style="font-size: x-large;">Inoffizieller Stundenplan - Beta</div>
        <!--<div class="lms-title">Hinweis: 'fehlt' bedeutet nicht 'fällt aus'</div>-->
      </div>
    </div>
    <q-card class="q-ma-md">
      <q-card-section class="items-center justify-between q-ma-md col" horizontal>
        <div class="col-4 row items-center justify-start q-gutter-md">
          <q-select v-model="auswahltyp" :options="auswahltypen"
                    dense
                    emit-value
                    label="Auswahltyp"
                    map-options
                    options-dense
                    style="width: 200px" @update:model-value="auswahlwert=null"></q-select>
          <q-select v-model="auswahlwert" :option-label="auswahlwertconf[auswahltyp]['label']"
                    :options="AUSWAHLOPTIONEN[auswahltyp]"
                    dense
                    label="Bitte wählen"
                    options-dense
                    style="min-width: 150px"></q-select>
        </div>

        <div class="col-4 row items-center justify-center q-gutter-md">
          <q-btn dense no-caps @click="calendar.prev()">Woche zurück</q-btn>
          <q-btn dense no-caps @click="calendar.moveToToday()">Woche Heute</q-btn>
          <q-btn dense no-caps @click="calendar.next()">Woche vor</q-btn>
        </div>
        <div class="col-4 row items-center justify-end q-gutter-md">
          <q-btn dense no-caps @click="reloadTimetableFile()">Lade Plandatei neu</q-btn>
          <div class="list no-border ">
            <div class="item">
              <div class="item-content">
                Letzte Änderung:
              </div>
            </div>
            <div class="item">
              <div id="last_change" class="item-content">

              </div>
            </div>

          </div>


          <!--
          <q-label id="last_change">
            Letzte Änderung:
          </q-label>

          <q-select
            dense
            options-dense
            v-model="plantyp"
            label="Plantyp"
            :options="['Vertretungsplan', 'Stundenplan']"
            @update:model-value="reloadTimetableFile()"
          />-->
        </div>
      </q-card-section>
      <q-card-section>
        <q-calendar
            ref="calendar"
            v-model="selectedDate"
            :disabled-after="planbis.clone().add(1,'day').format('YYYY-MM-DD')"
            :disabled-before="planvon.clone().subtract(1,'day').format('YYYY-MM-DD')"
            :interval-count="46"
            :interval-height="17"
            :interval-minutes="15"
            :interval-start="30"
            :weekdays="[1,2,3,4,5]"
            animated
            bordered
            date-type="square"
            hour24-format
            locale="de"
            no-active-date view="week">
          <template #head-day="{ scope: { timestamp }}">
            <div class="text-center">{{ wochentag(timestamp.date) }}</div>
            <div class="text-center">{{ schönesDatum(timestamp.date) }}</div>
          </template>
          <template #head-day-event="{ scope }">
            <template v-if="UNTERRICHT">
              <div
                  v-for="event in UNTERRICHT.displaySchedule.eventTimes.filter(e => filterEventTimes(e, scope.timestamp.date))"
                  :key="event.eventRef+scope.timestamp.date"
                  class="dayevent q-ma-xs q-pa-xs bg-positive text-white rounded-borders">
                {{ event.eventCaption }}
              </div>
            </template>
          </template>
          <template #day-container="{ scope: { days }}">
            <template v-if="hasDate(days)">
              <div
                  :style="nowstyle"
                  class="day-view-current-time-indicator"
              />
              <div
                  :style="nowstyle"
                  class="day-view-current-time-line"
              />
            </template>
          </template>
          <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
            <template v-for="event in UNTERRICHTEVENTS[timestamp.date]" :key="event.lessonRef">
              <eventcard
                  :courseinfo="COURSES[event.courseRef]"
                  :eventinfo="event"
                  :style="badgeStyles(event, timeStartPos, timeDurationHeight)"
                  class="event">
                <q-popup-proxy breakpoint="5000px">
                  <eventcard
                      :courseinfo="COURSES[event.courseRef]"
                      :eventinfo="event"
                      style="width: 200px; height:200px; font-size: 150%;"/>
                </q-popup-proxy>
              </eventcard>
            </template>
            <template v-for="aufsicht in AUFSICHTENEVENTS[timestamp.date]" :key="aufsicht.lehrer+aufsicht.zeit">
              <aufsichtcard
                  :aufsichtinfo="aufsicht"
                  :style="badgeStyles(aufsicht, timeStartPos, timeDurationHeight)"
                  class="event">
                <q-popup-proxy breakpoint="5000px">
                  <aufsichtcard
                      :aufsichtinfo="aufsicht"
                      style="height: 200px; width:200px; font-size: 15px;"/>
                </q-popup-proxy>
              </aufsichtcard>
            </template>
          </template>
        </q-calendar>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import eventcard from './eventcard.vue';
import aufsichtcard from './aufsichtcard.vue';

let mod_auth_openidc_session;


const COURSES = ref({})

const calendar = ref()
const selectedDate = ref(QCalendar.today());
const planvon = ref(moment().subtract(1, 'month'))
const planbis = ref(moment().add(1, 'month'))
const currentDate = ref()
const currentTime = ref()
const timeStartPos = ref()
const UNTERRICHT = ref()
const AUFSICHTEN = ref()
const plantyp = ref('Vertretungsplan')
const auswahltyp = ref('klasse')
const auswahltypen = [
  {label: 'Klassen (ohne 12,13)', value: 'klasse'},
  {label: 'Schüler/in (nur 12,13)', value: 'schueler'},
  {label: 'Lehrer/in', value: 'lehrer'},
  {label: 'Räume', value: 'raum'},
  {label: 'Assitent/in', value: 'assistent'}
]
const auswahlwertconf = ref({
  'klasse': {label: 'code', value: 'code'},
  'raum': {label: 'code', value: 'code'},
  'lehrer': {label: 'code', value: 'code'},
  'schueler': {label: 'name', value: 'name'},
  'assistent': {label: 'name', value: 'name'},
})
const auswahlwert = ref()

const AUSWAHLOPTIONEN = computed(function () {
  console.log('computed')
  const assis = []
  COURSES.value = {}
  if (!UNTERRICHT.value) return assis;
  const assistentenRE = /TA:([0-9a-zöäüß]+)/gi;
  for (let course of UNTERRICHT.value.courses) {
    COURSES.value[course.id] = course
    if (!course['remarks']) continue
    const assistenten = course['remarks'].match(assistentenRE)
    if (!assistenten) continue
    for (let assistent of assistenten) {
      const assiname = assistent.substring(3)
      if (assis.indexOf(assiname) < 0) {
        assis.push(assiname)
      }
    }
  }

  const d = {
    'klasse': UNTERRICHT.value['classes'].filter(a => !(a.code in {"12": "", "13": ""})),
    'schueler': UNTERRICHT.value['students'].filter(a => !a.name.includes('_')).sort((a, b) => a.name.localeCompare(b.name)),
    'lehrer': UNTERRICHT.value['teachers'].sort((a, b) => a.code.toLowerCase().localeCompare(b.code.toLowerCase())),
    'raum': UNTERRICHT.value['rooms'],
    'assistent': assis
  }
  return d
})

function formatDate(dateString) {
  const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sept.', 'Okt.', 'Nov.', 'Dez.'];
  const weekdays = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];

  const year = dateString.slice(0, 4);
  const monthIndex = parseInt(dateString.slice(4, 6), 10) - 1;
  const day = dateString.slice(6, 8);
  const hour = dateString.slice(9, 11);
  const minute = dateString.slice(11, 13);

  const date = new Date(year, monthIndex, day, hour, minute);
  const dayOfWeek = weekdays[date.getDay()];
  const month = months[monthIndex];

  return `${dayOfWeek}, ${day}. ${month} ${hour}:${minute}`;
}


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function nächsterWert() {
  const wert = auswahlwert.value
  const options = AUSWAHLOPTIONEN.value[auswahltyp.value]
  const idx = options.indexOf(wert)
  if (idx != options.length - 1)
    auswahlwert.value = options[idx + 1]
}

function vorigerWert() {
  const wert = auswahlwert.value
  const options = AUSWAHLOPTIONEN.value[auswahltyp.value]
  const idx = options.indexOf(wert)
  if (idx != 0)
    auswahlwert.value = options[idx - 1]
}

const AUFSICHTENEVENTS = computed(() => {
  const events = {};
  if (!AUFSICHTEN.value) return events

  for (let aufsicht of AUFSICHTEN.value) {
    const von = moment(aufsicht.tag + ' ' + aufsicht.von)
    const bis = moment(aufsicht.tag + ' ' + aufsicht.bis)
    const event = createEvent(aufsicht, von.format('YYYYMMDD'), von.format('HHmm'), bis.format('HHmm'))
    event['teacherCodes'] = [aufsicht.lehrer]
    addEvent(events, event)
  }
  return events;
})

const UNTERRICHTEVENTS = computed(() => {
  const events = {};
  if (!UNTERRICHT.value) return events

  for (let lesson of UNTERRICHT.value.displaySchedule.lessonTimes) {
    if (lesson.dates) {
      for (let lessondate of lesson.dates) {
        const event = createEvent(lesson, lessondate, lesson['startTime'], lesson['endTime'])
        addEvent(events, event)
      }
    } else {
      const event = createEvent(lesson, moment().weekday(lesson.weekday - 1).format('YYYYMMDD'), lesson['startTime'], lesson['endTime'])
      addEvent(events, event)
    }
  }
  for (let datum in events) {
    events[datum].sort(sortiereTagesevents)
    sizeAndPosition(events[datum])
  }
  return events;
})

function sortiereTagesevents(a, b) {
  const val = a.startzeit.localeCompare(b.startzeit)
  if (val == 0) {
    if (a.dauer < b.dauer) return 1;
    if (a.dauer > b.dauer) return -1;
    return 0
  }
  return val
}

function addEvent(events, event) {
  if (!istInteressant(event)) return
  const datum = event.start.format('YYYY-MM-DD')
  if (!(datum in events)) {
    events[datum] = []
  }
  events[datum].push(event)
}

function createEvent(lesson, date, startTime, endTime) {
  const start = moment(date + ' ' + startTime, 'YYYYMMDD HHmm');
  const end = moment(date + ' ' + endTime, 'YYYYMMDD HHmm');
  const event = {
    'start': start,
    'end': end,
    'xpos': 0,
    'xmax': 1,
    'overlaps': [],
    'startzeit': start.format('HH:mm'),
    'endzeit': end.format('HH:mm'),
    'dauer': end.diff(start, 'minutes'),
    ...lesson
  }
  return event
}

function isOverlapping(ev1, ev2) {
  return !(ev1.start.isBefore(ev2.start) && ev1.end.isSameOrBefore(ev2.start) ||
      ev1.end.isAfter(ev2.end) && ev1.start.isSameOrAfter(ev2.end))
}

function calculateOverlaps(eventlist) {
  for (let i = 0; i < eventlist.length; i++) {
    for (let j = i + 1; j < eventlist.length; j++) {
      const ev1 = eventlist[i]
      const ev2 = eventlist[j]
      if (isOverlapping(ev1, ev2)) {
        ev1.overlaps.push(ev2)
        ev2.overlaps.push(ev1)
      }
    }
  }
}

function sizeAndPosition(eventlist) {
  calculateOverlaps(eventlist)
  const eventspalten = []
  mainloop:
      for (let event of eventlist) {
        for (var sp = 0; sp < eventspalten.length; sp++) {
          const evlist = eventspalten[sp]
          let neue_spalte_nötig = false
          for (let ev of evlist) {
            let überlappt = isOverlapping(event, ev)
            neue_spalte_nötig |= überlappt
          }
          if (!neue_spalte_nötig) {
            evlist.push(event)
            event.xpos = sp
            continue mainloop
          }
        }
        eventspalten[sp] = [event]
        event.xpos = sp
      }

  for (let event of eventlist) {
    event.xmax = Math.min(eventspalten.length, event.overlaps.length + 1)
    event.spalten = eventspalten
  }
}

function wochentag(datum) {
  return moment(datum).format('dddd')
}

function schönesDatum(datum) {
  return moment(datum).format('D. MMMM YYYY')
}

function holeBemerkungen(event) {
  const courseRef = event['courseRef']
  if (!courseRef) return ''
  const course = COURSES.value[courseRef]
  if (!course) return ''
  const bemerkungen = course['remarks']
  return bemerkungen ? bemerkungen : ''
}

function istInteressantSchueler(event, schueler) {
  if (event.hasOwnProperty('courseRef')) {
    var course = COURSES.value[event.courseRef];
    //if (course.hasOwnProperty('remarks')) console.log(course.remarks);
    if (course.hasOwnProperty('studentRefs')) {
      return course.studentRefs.indexOf(schueler.id) >= 0;
    }
  }
  if (event.hasOwnProperty('studentRefs')) {
    return event.studentRefs.indexOf(schueler.id) >= 0;
  }
  // Trage das Event ein, wenn es sich um eine Mitteilung an
  // den ganzen Jahrgang 12 oder 13 handelt.
  if (event.hasOwnProperty('classCodes')) {
    for (var classcode of event.classCodes) {
      if (schueler.name.includes(classcode)) {
        return true;
      }
    }
  }
  return false
}

function istInteressantAssitent(event, assistent) {
  const bemerkung = holeBemerkungen(event)
  if (!bemerkung) return false;
  return bemerkung.includes(assistent);
}

function istInteressant(event) {
  if (!auswahlwert.value) {
    return false
  }
  switch (auswahltyp.value) {
    case 'klasse':
      return event.classCodes && event.classCodes.indexOf(auswahlwert.value.code) > -1;
    case 'lehrer':
      return event.teacherCodes && event.teacherCodes.map(tc => tc.toLowerCase()).indexOf(auswahlwert.value.code.toLowerCase()) > -1;
    case 'raum':
      return event.roomCodes && event.roomCodes.indexOf(auswahlwert.value.code) > -1;
    case 'schueler':
      return istInteressantSchueler(event, auswahlwert.value);
    case 'assistent':
      return istInteressantAssitent(event, auswahlwert.value);
  }
  return false
}

function filterEventTimes(ev, date) {
  return moment(date).isBetween(moment(ev.startDate), moment(ev.endDate), undefined, '[)')
}

function badgeStyles(event, timeStartPos = undefined, timeDurationHeight = undefined) {
  const s = {}
  if (timeStartPos && timeDurationHeight) {
    s.top = timeStartPos(event.start.format('HH:mm')) + 'px'
    s.height = timeDurationHeight(event.dauer) + 'px'
  }
  s.width = `${100 / event.xmax}%`
  s.left = `${event.xpos / event.xmax * 100}%`
  return s
}

function SATlogin() {

  proxyQuery("SATlogin", "IServSATId=" + getCookie("IServSATId") + "&IservSAT=" + getCookie("IservSAT") + "&IservSession=" + getCookie("IservSession"))

      .then(data => {
        document.cookie = "mod_auth_openidc_session=" + data["mod_auth_openidc_session"];
        mod_auth_openidc_session = data["mod_auth_openidc_session"]
        initTimetable()
      })
      .catch((result) => {
        console.log("Login failed, redirecting to login page")
        window.location.href = 'login.html'; //one level up

        //fehlermeldung(result.statusText, result.url)
        //throw new Error(result)
      })
}

function reloadTimetableFile() {
  let jsonfile = "vertretungsplan.json";
  if (plantyp.value == 'Stundenplan') {
    jsonfile = "stundenplan.json";
  }

  if (getCookie("mod_auth_openidc_session")) {
    mod_auth_openidc_session = getCookie("mod_auth_openidc_session")
    startTimetable(mod_auth_openidc_session);
  } else if (getCookie("IServSATId") && getCookie("IservSAT") && getCookie("IservSession")) {
    SATlogin();
  } else {
    console.log("Login failed, redirecting to login page")
    window.location.href = 'login.html';
  }


}

function startTimetable(mod_auth_openidc_session) {

  return proxyQuery("json", "key=" + mod_auth_openidc_session)
      .then(data => {

        UNTERRICHT.value = data.result
        U = data.result
        if (plantyp.value == 'Stundenplan') {

          notiz('Der Stundenplan ist nur in der aktuellen Woche zu sehen.', 'Letzte Änderung: ' + data.lastmod)
          calendar.value.moveToToday()
          planvon.value = moment().day(1)
          planbis.value = moment().day(5)
          AUFSICHTEN.value = null
        } else {
          planvon.value = moment(UNTERRICHT.value.displaySchedule.effectivity.startDate, 'YYYYMMDD')
          planbis.value = moment(UNTERRICHT.value.displaySchedule.effectivity.endDate, 'YYYYMMDD')
          const lastmodified_element = document.getElementById("last_change");

          let lastmodified = data['about']['serverTimeStamp'];
          lastmodified = formatDate(lastmodified);

          lastmodified_element.textContent = lastmodified;


          notiz(`Der Vertretungsplanplan gilt vom ${schönesDatum(planvon.value)}
             bis zum ${schönesDatum(planbis.value)}.`, 'Letzte Änderung: ' + lastmodified)
          //holeAufsichten()
        }
      })
      .catch((result) => {
        console.log("mod_auth_openidc_session invalid, trying SATlogin")
        console.log(result)
        SATlogin();
        //fehlermeldung(result.statusText, result.url)
        //throw new Error(result)
      })
}

function holeAufsichten() {
  httpQuery('stundenplan.py', {
    action: 'holeAufsichten',
    von: planvon.value.format('YYYY-MM-DD'),
    bis: planbis.value.format('YYYY-MM-DD')
  })
      .then((data) => {
        AUFSICHTEN.value = data.aufsichten
      })
      .catch((result) => {
        fehlermeldung(result.statusText, result.url)
        throw new Error(result)
      })
}

function init() {
  return proxyQuery("py", "key=" + mod_auth_openidc_session, {
    action: 'init'
  })
}


async function setzteAuswahlwert(typ, wert) {
  auswahltyp.value = typ
  const auswahlwertvalue = auswahlwertconf.value[typ]['value']

  let blub;
  //auswahlwert.value = "hihi";

  setTimeout(async function () {

    //console.log(w[auswahlwertvalue]);
    if (typ === "schueler") {

      const nameParts = wert.toLowerCase().split(' ');

      // Extract the first name and join the rest into a single string
      const firstName = nameParts[0];
      const restOfName = nameParts.slice(1).join(' ');


      let name = `${restOfName}, ${firstName}`


      blub = AUSWAHLOPTIONEN.value[typ].filter(w => {
        return w[auswahlwertvalue].toLowerCase().includes(name)
      })[0]
    } else {
      blub = AUSWAHLOPTIONEN.value[typ].filter(w => {
        return w[auswahlwertvalue].toLowerCase().includes(wert.toLowerCase())
      })[0]
    }

    auswahlwert.value = blub

  }, 1500);


}


function handleKeycode(ev) {
  ev.preventDefault();
  switch (ev.keyCode) {
    case 37: //left
      return calendar.value.prev()
    case 38: //up
      return vorigerWert()
    case 39: //right
      return calendar.value.next()
    case 40: //down
      return nächsterWert()
  }
}

function initTimetable() {
  const timetableprom = reloadTimetableFile()

  const initprom = init()


  Promise.all([initprom, timetableprom])
      .then((alldata) => {
        const params = new URLSearchParams(window.location.search)
        for (const [k, v] of params.entries()) {
          if (auswahlwertconf.value[k]) {
            setzteAuswahlwert(k, v)
            return
          }
        }

        const user = alldata[0]['user']
        if (user.ist_lehrer) {
          setzteAuswahlwert('lehrer', user.id)
        } else {
          if (user.klasse != '(unbekannt)') {
            if (['12', '13'].indexOf(user.klasse) >= 0) {
              setzteAuswahlwert('schueler', user.name)
              console.log('schueler gesetzt')
            } else {
              setzteAuswahlwert('klasse', user.klasse)
              console.log('klasse gesetzt')
            }
          }
        }
      })
}

onMounted(() => {
  adjustCurrentTime()
  // now, adjust the time every minute
  setInterval(() => {
    adjustCurrentTime()
  }, 60000)

  document.addEventListener('keydown', handleKeycode)
  initTimetable();
})

function adjustCurrentTime() {
  const now = moment()
  currentDate.value = now.format('YYYY-MM-DD')
  currentTime.value = now.format('HH:mm')
  timeStartPos.value = calendar.value.timeStartPos(currentTime.value, false)
}

function hasDate(days) {
  const today = moment().format('YYYY-MM-DD')
  return days.find(day => day.date === today)

}

const nowstyle = computed(() => {
  const pos = calendar.value.timeStartPos(currentTime.value, false)
  return {
    top: pos + 'px'
  }
})

</script>

<style>
.event {
  position: absolute;
  font-size: 12px;
  padding: 5px;
  cursor: pointer;
}

.dayevent {
  font-size: 12px;
}

.lms-title {
  text-align: center;
}

.day-view-current-time-indicator {
  position: absolute;
  left: -5px;
  height: 10px;
  width: 10px;
  margin-top: -4px;
  background-color: var(--q-accent);
  border-radius: 50%;
}

.day-view-current-time-line {
  position: absolute;
  left: 5px;
  border-top: var(--q-accent) 2px solid;
  width: calc(100% - 5px);
}

.q-calendar-day__day.q-current-day {
  background-color: #383838ff;
}
</style>