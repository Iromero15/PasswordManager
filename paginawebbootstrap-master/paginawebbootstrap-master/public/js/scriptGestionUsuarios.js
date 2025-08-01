/*
 *
 * Desarrollo web (HTML + CSS + BS) - Frontend
 * Manejo de perfiles de usuario + Base de datos (JS + Firebase) - Backend
 * 
 *  |  ˄
 *  |  |
 *  ˅  |
 * 
 * Base de datos
 * 
 *  |  ˄
 *  |  |
 *  ˅  |
 * 
 * Microcontrolador ESP32 / ESP8266 (C++); IoT
 * - STA
 * - AP
 * - STA + AP
 * 
 */

/*
 * Objetivo del día:
 * 1. Repasar la creación de usarios con el servicio de Firebase Auth √
 * 2. Presentar el uso de promesas -> .then .catch √
 * 3. Presentar el servicio de logIn de Firebase Auth √
 * 4. Cargar información en una base de datos empleando el servicio de Firebase RTdb √
 * 5. Asociar esta información al usuario logueado.
 * 6. Modals de Bootstrap + Librerías JS. 
 */

// Módulos js: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Statements/import
//             https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Modules#aplicar_el_m%C3%B3dulo_a_tu_html
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import { getDatabase, child, ref, push, update, set} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDApjWwVMl3FbpVl64cTBFKyrLtu0vn1mI",
    authDomain: "databaseformoroni.firebaseapp.com",
    databaseURL: "https://databaseformoroni-default-rtdb.firebaseio.com/",
    projectId: "databaseformoroni",
    storageBucket: "databaseformoroni.appspot.com",
    messagingSenderId: "115870039693",
    appId: "1:115870039693:web:54d3dc6e4e4db28476acc4"
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

// var mensaje = prompt("Ingresa mensaje: ");
// set(ref(database, "datos/"), {
//     dato: mensaje
// });

console.log("Consola de pruebas...");

// Referencias al HTML
var correoRef = document.getElementById("direccionCorreoId");
var passRef = document.getElementById("passwordId");
var CreateCorreoRef = document.getElementById("CDireccionCorreoId");
var CreatePassRef = document.getElementById("CPasswordId");
var CreatePass2Ref = document.getElementById("CPassword2Id");
var CreateNameRef = document.getElementById("CNameId");
var CreateCityRef = document.getElementById("CCityId");
var buttonRef = document.getElementById("altaButtonId");
var ingresarRef = document.getElementById("ingresarButtonId");

// Event Listeners
buttonRef.addEventListener("click", altaUsuario);
CreateCityRef.addEventListener("keypress", (e) => { 
    if (e.key === 'Enter'){
       altaUsuario();
   }})
ingresarRef.addEventListener("click", logIn);
passRef.addEventListener("keypress", (e) => { 
    if (e.key === 'Enter'){
       logIn();
   }})
const auth = getAuth();

// Promesas: https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Using_promises
//           https://developer.mozilla.org/es/docs/Glossary/Callback_function
//           https://www.youtube.com/watch?v=slIJj-zbs_M

function altaUsuario()
{

    console.log("Ingreso a la función altaUsuario().");

    if((CreateCorreoRef.value != '') && (CreatePassRef.value != '') && (CreatePass2Ref.value != '') && (CreateNameRef.value != '') && (CreateCityRef.value != ''))
    {
        // https://www.w3schools.com/js/js_arrow_function.asp
        if (CreatePass2Ref.value != CreatePassRef.value)
            {
                alert("Las contraseñas no coinciden")
            }
        else
        {
            createUserWithEmailAndPassword(auth, CreateCorreoRef.value, CreatePassRef.value)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log("Usuario: " + user + " ID: " + user.uid);
                console.log("Creación de usuario.");
                DataBaseUser(user.uid)
                //window.location.href = "./informacion.html";

            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("Código de error: " + errorCode + " Mensaje: " + errorMessage);
                if(errorCode == 'auth/email-already-in-use'){
                    alert("Mail ya empleado por otro usuario.");
                }
            });
        }
        
    }
    else
    {
        alert("Revisar que los campos de usuario y contraseña esten completos.");
    }    

}
function DataBaseUser(uid)
{
    let email = CreateCorreoRef.value
    let nombre = CreateNameRef.value
    let ciudad = CreateCityRef.value
    const UserData = {
        uid:  uid,
        Name: nombre,
        Email: email, 
        city: ciudad,
      };
    CreateCorreoRef.value = ""
    CreateNameRef.value = ""
    CreateCityRef.value = ""
    CreatePass2Ref.value = ""
    CreatePassRef.value = ""
    console.log(UserData)
    console.log(uid)

    set(ref(database, "users/" + uid), {
        UserData
    })
    alert("Carga de usuario correcta.");
}
function logIn ()
{

    if((correoRef.value != '') && (passRef.value != '')){

        signInWithEmailAndPassword(auth, correoRef.value, passRef.value)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            window.location.href = "../index.html";
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Código de error: " + errorCode + " Mensaje: " + errorMessage);
        });
    }
    else{
        alert("Revisar que los campos de usuario y contraseña esten completos.");
    }    
}
