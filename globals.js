let U = {};

// Backend Proxy
let server = "http://server.rapidrix.de:40047/";

function fehlermeldung(msg, traceback = "") {
  console.log(msg);
  console.log(traceback);
  text =
    msg.replace(/(?:\r\n|\r|\n)/g, "<br>") + "<pre>" + traceback + "</pre>";
  Quasar.Notify.create({
    message: text,
    caption: "Programmfehler - bitte dem Programmierer Bescheid geben",
    html: true,
    position: "top",
    color: "negative",
    timeout: 0,
    actions: [
      {
        label: "Ok",
        color: "white",
      },
    ],
  });
}

function warnung(text, caption) {
  console.log(text, caption);
  Quasar.Notify.create({
    message: text,
    caption: caption,
    position: "top",
    type: "warning",
  });
}

function notiz(text, caption) {
  Quasar.Notify.create({
    message: text,
    caption: caption,
    position: "top",
    type: "positive",
  });
}

function proxyQuery(url, data) {
  const fullUrl = server + url + "?" + data;
  const request = new Request(fullUrl, {
    method: "GET",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (request.status == 200) {
    return fetchPromise(request);
  }

  return fetch(request).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  });
}

function httpQuery(url, data) {
  url = "https://stundenplan.osz-lise-meitner.eu/" + url;
  const request = new Request(url, {
    method: "POST",
    cache: "no-cache",
    credentials: "include", // Include credentials (cookies)
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  console.log(request.status);

  if (request.status == 200) {
    return fetchPromise(request);
  }
}

function fetchPromise(request) {
  return new Promise((resolve, reject) => {
    fetch(request)
      .then(async (response) => {
        let contenttype = response.headers.get("Content-Type");
        if (response.status == 401) {
          warnung("Sitzung abgelaufen. Bitte laden Sie die Seite neu.");
          reject(response);
          return;
        }
        if (contenttype == "application/json") {
          let antwort = await response.json();
          switch (response.status) {
            case 200:
              const lastmod = response.headers.get("Last-Modified");
              antwort["lastmod"] = lastmod;
              resolve(antwort);
              return;
            case 400:
              warnung(antwort.msg);
              reject(antwort);
              return;
            case 409:
              fehlermeldung(antwort.msg, antwort.traceback);
              reject(antwort);
              return;
            default:
              reject(antwort);
              return;
          }
        } else {
          if (response.status == 200) resolve(await response.blob());
          else reject(response);
        }
      })
      .catch(reject);
  });
}
