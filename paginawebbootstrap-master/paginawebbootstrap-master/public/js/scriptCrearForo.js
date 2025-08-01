
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import { getDatabase, child, ref, push, update, set, get, remove} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";

console.log("Inicio del programa")

const firebaseConfig = {
    apiKey: "AIzaSyDApjWwVMl3FbpVl64cTBFKyrLtu0vn1mI",
    authDomain: "databaseformoroni.firebaseapp.com",
    databaseURL: "https://databaseformoroni-default-rtdb.firebaseio.com",
    projectId: "databaseformoroni",
    storageBucket: "databaseformoroni.appspot.com",
    messagingSenderId: "115870039693",
    appId: "1:115870039693:web:54d3dc6e4e4db28476acc4"
  };

  const app = initializeApp(firebaseConfig);
//Referencias al HTML
var Section = document.getElementById("SectionId");
var textoRef = document.getElementById("textoForoId");
var tituloRef = document.getElementById("TituloForoId");
var botonRef = document.getElementById("buttonForoId");
var botonEditRef = document.getElementById("buttonEditId");
var usuarioRef = document.getElementById("UserLogId");
var WriterRef = document.getElementById("SWrite");

var btnLogIn = document.getElementById("btnlogin");
var btnLogOut = document.getElementById("btnlogout");
// var 
var UsuarioData;
var Posts;
var change = 0;
const auth = getAuth();
const database = getDatabase();
const user = auth.currentUser;
var UserID;
var thekey;
//Events
btnLogOut.addEventListener("click", LogOut)
botonRef.addEventListener("click", writeNewPost);
botonEditRef.addEventListener("click", FinishEdit);
textoRef.addEventListener("keypress", (e) => {
    if (e.key === 'Enter')
    {
      if (change == 0)
      {
        writeNewPost()
      }
      else
      {
        FinishEdit()
      }
    }
})



botonEditRef.style.display = "none";
botonRef.style.display = "block";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, see docs for a list of available properties
    // https://firebase.google.com/docs/reference/js/firebase.User
    console.log("Usuario logeado")
    btnLogIn.style.display = "none";
    btnLogOut.style.display = "block";
    
    get(ref(database, "users/" + user.uid ) ).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
        UsuarioData = snapshot.val().UserData
        console.log(UsuarioData.Name + " de " + UsuarioData.city)
        UserID = UsuarioData.uid
        usuarioRef.appendChild(document.createTextNode(UsuarioData.Name + " "))
        GetDataBase()
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
    
}
else
{
  console.log("Usuario no logeado")
  btnLogIn.style.display = "block";
  btnLogOut.style.display = "none";
  WriterRef.innerHTML  = ""
  GetDataBase()
  
}});

//Codigo
function LogOut()
{
  auth.signOut()
  location.reload(true)
}
function GetDataBase()
{
  get(ref(database, "posts/")).then((snapshot) => {
    if (snapshot.exists()) {
      console.log(snapshot.val());
      Posts = snapshot.val()
      console.log(Posts)
      for (const i in Posts)
      {
        console.log(Posts[i].uid)
        let uid = Posts[i].uid
        Post(Posts[i].title, Posts[i].body, Posts[i].author, Posts[i].city, i,uid)
      }
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    console.error(error);
  });
  
}
function writeNewPost(){
  console.log("Boton Apretado")
  // A post entry.
  const postData = {
    author: UsuarioData.Name,
    body: textoRef.value,
    title: tituloRef.value,
    city: UsuarioData.city,
    uid: UsuarioData.uid,
  };
  const newPostKey = push(child(ref(database), 'posts')).key;
  Post(tituloRef.value, textoRef.value, UsuarioData.Name, UsuarioData.city, newPostKey, UsuarioData.uid)
  tituloRef.value = ""
  textoRef.value = ""
  const updates = {};
  updates['/posts/' + newPostKey] = postData;

  return update(ref(database), updates)};

  function Post(titulo, cuerpo, nombre, ciudad, key, Userid)
  {
    var tag = document.createElement("div");
    tag.classList.add('post');
    var title = document.createElement("h4");
    var text = document.createTextNode(cuerpo);
    var titext = document.createTextNode(titulo + " [Publicado por " + nombre + " (" + ciudad + ")]")
    title.appendChild(titext);
    tag.appendChild(title);
    tag.appendChild(text);
    console.log(UserID);
    if (Userid == UserID)
    {
      var botonE = document.createElement("i");
      botonE.classList.add('bi' , 'bi-pencil-fill');
      var botonC = document.createElement("i");
      botonC.classList.add('bi' , 'bi-trash3');
      var btextE = document.createTextNode("Editar");
      var btextC = document.createTextNode("Eliminar");
      // botonE.appendChild(btextE)
      // botonC.appendChild(btextC)
      tag.appendChild(botonE)
      tag.appendChild(botonC)
      botonE.addEventListener("click", (e) => {
        console.log("1");
        EditPost(key);
      })
      botonC.addEventListener("click", (e) => {
        ClearPost(key);
        console.log("2");
      });
    }
    
    Section.prepend(tag);
  }

function EditPost(Postkey)
{
    thekey = Postkey
    console.log("EDITANDO post: " + thekey)
    get(ref(database, "posts/" + thekey)).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
        Posts = snapshot.val()
        textoRef.value = Posts.body
        tituloRef.value = Posts.title 
        botonRef.style.display = "none";
        botonEditRef.style.display = "block";
        change = 1
      } 
      else 
      {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
}
function FinishEdit()
{
  remove(ref(database, "posts/" + thekey))
  writeNewPost()
  location.reload(true)
}
function ClearPost(Postkey)
{
  console.log("BORRANDO post: " + Postkey);
  remove(ref(database, "posts/" + Postkey));
  location.reload(true)
}