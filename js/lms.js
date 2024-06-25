
function fehlermeldung(msg, traceback='', caption='Programmfehler - bitte dem Programmierer Bescheid geben') {
    text = msg.replace(/(?:\r\n|\r|\n)/g, '<br>') + '<pre>' + traceback + '</pre>';
    Quasar.Notify.create({
        message: text,
        'caption': caption,
        html: true,
        position: 'top',
        color: 'negative',
        timeout: 0,
        actions: [{
            label: 'Ok',
            color: 'white',
        }],
});
}

function warnung(text) {
    Quasar.Notify.create({
        html: true,
        message: text,
        position: 'top',
        type: 'warning',
    });
}

function notiz(text) {
    Quasar.Notify.create({
        html: true,
        message: text,
        position: 'top',
        type: 'positive'
    });
}

function gesamtFZ(fehlzeiten, typ) {
    anzahl = 0;
    for(var idx in fehlzeiten) {
        const fehlzeit = fehlzeiten[idx];

        // Schulische Veranstaltungen und Tagkonflikte werden nicht gezählt
        if(fehlzeit['statistik'] == 'ohne' || fehlzeit['tagkonflikt'])
            continue;

        switch(typ) {
        case 'neu':
            if (fehlzeit['statistik'] == 'neu')
                anzahl++;
            break;
        case 'V':
            if (fehlzeit['statistik'] == 'verspaetung')
                anzahl++;
            break;
        case 'gT':
            // Ein Faktor von 0 bedeutet: ganzer Tag
            // Wenn nicht Verspätung und...
            if (fehlzeit['status'] != 1 && fehlzeit['faktor'] == 0.0)
                anzahl++
            break;
        case 'gTu':
            // Ein Faktor von 0 bedeutet: ganzer Tag
            // Wenn nicht Verspätung und...
            if (fehlzeit['status'] != 1 && fehlzeit['faktor'] == 0.0 && fehlzeit['statistik'] == 'unentschuldigt')
                anzahl++
            break;
        case 'gS':
            // Wenn nicht Verspätung und...
            if (fehlzeit['status'] != 1 && fehlzeit['faktor'] != 0.0)
                anzahl += fehlzeit['faktor']
            break;
        case 'gSu':
            // Wenn nicht Verspätung und...
            if (fehlzeit['status'] != 1 && fehlzeit['faktor'] != 0.0 && fehlzeit['statistik'] == 'unentschuldigt')
                anzahl += fehlzeit['faktor']
            break;
        }
    }
    return anzahl;
}

//function httpQuery(data) {
//    const request = new Request('klassenbuch.py', {
//        method: 'POST',
//        cache: 'no-cache',
//        headers: {
//            'Content-Type': 'application/x-www-form-urlencoded'
//        },
//        body: (new URLSearchParams(data)).toString()
//    });
//    return new Promise((resolve, reject) => {
//        fetch(request)
//        .then(async (response) => {
//            switch(response.status) {
//                case 200:
//                    var antwort = await response.json().catch(console.log);
//                    resolve(antwort);
//                    break
//                case 400:
//                    var antwort = await response.json().catch(console.log);
//                    warnung(antwort.msg);
//                    console.log(antwort);
//                    reject(antwort);
//                    break;
//                case 401:
//                    warnung('Sitzung abgelaufen. Bitte laden Sie die Seite neu.');
//                    console.log(data);
//                    reject(data);
//                    break;
//                case 409:
//                    var antwort = await response.json().catch(console.log);
//                    fehlermeldung(antwort.msg, antwort.traceback);
//                    console.log(antwort);
//                    reject(antwort);
//                    break;
//                default:
//                    reject(data,response)
//            }
//        })
//        .catch(console.log)
//    });
//}

function httpQuery(url, data) {
    const request = new Request(url, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: (new URLSearchParams(data)).toString()
    });
    return fetchPromise(request)
}

function httpFileupload(url, file, data) {
    const formular = new FormData();
    for (let key in data) 
        formular.append(key, data[key]);
    formular.append("file", file);
    
    const request = new Request(url, {
        method: 'POST',
        body: formular
    })
    return fetchPromise(request)
}

function fetchPromise(request) {
    return new Promise((resolve, reject) => {
        fetch(request)
        .then(async (response) => {
            let contenttype = response.headers.get('Content-Type');
            if(response.status == 401) {
                warnung('Sitzung abgelaufen. Bitte laden Sie die Seite neu.');
                reject(response);
                return;
            }
            if (contenttype == 'application/json') {
                let antwort = await response.json();
                switch(response.status) {
                    case 200:
                        resolve(antwort);
                        return;
                    case 400:
                        warnung(antwort.msg);
                        reject(antwort)
                        return;
                    case 409:
                        fehlermeldung(antwort.msg, antwort.traceback);
                        reject(antwort);
                        return;
                    default:
                        reject(antwort)
                        return;
                }
            }
            else {
                if(response.status == 200)
                    resolve(await response.blob());
                else
                    reject(response);
            }
        })
        .catch(reject)
    });
}
