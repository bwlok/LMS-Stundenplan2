// Backend Proxy
let server = "";


const loginButton = document.getElementById("login-button");

console.log(loginButton);

loginButton.addEventListener("click", function () {
    const usernameInput = document.querySelector('input[name="_username"]');
    const passwordInput = document.getElementById("password_login");

    // Get the values of the input fields
    const username = usernameInput.value;
    const password = passwordInput.value;


    login(username, password);
});

async function login(username, password) {
    let state;

    const spanToRemove = document.querySelector('.fal.fa-arrow-right-to-bracket.login-icon-bracket');

    if (spanToRemove) {
        spanToRemove.parentNode.removeChild(spanToRemove);

        const newSpan = document.createElement('span');
        newSpan.classList.add('fal', 'fa-circle-notch', 'fa-spin', 'login-icon-spin');

        const parentElement = document.getElementById('login-button');

        parentElement.insertBefore(newSpan, parentElement.childNodes[0]);

    }

    const response = await fetch(
        server + "login?username=" + username + "&password=" + password,
    ).then((response) => {
        state = response.status;
        if (response.status === 200) {
            return response.json();
        } else {
            return null;
        }
    });

    console.log(state);

    switch (state) {
        case 200: {
            document.cookie = "IservSession=" + response["IservSession"];
            document.cookie = "IServSATId=" + response["IServSATId"];
            document.cookie = "IservSAT=" + response["IservSAT"];
            document.cookie =
                "mod_auth_openidc_session=" + response["mod_auth_openidc_session"];

            console.log(response);

            console.log("Working");
            window.location.href = './';

            break;
        }

        case 403: {
            console.log("Invalid shit");

            const spanToRemove = document.querySelector('.fal.fa-circle-notch.fa-spin.login-icon-spin');

            if (spanToRemove) {
                spanToRemove.parentNode.removeChild(spanToRemove);

                const newSpan = document.createElement('span');
                newSpan.classList.add('fal', 'fa-arrow-right-to-bracket', 'login-icon-bracket');

                const parentElement = document.getElementById('login-button');

                parentElement.insertBefore(newSpan, parentElement.childNodes[0]);

            }

            document.getElementById('WARNUNG').style.display = 'block';

            break;
        }

        default: {
            console.log("LALALA");
        }
    }
}
