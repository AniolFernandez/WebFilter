function eliminarPort(button){
    button.parentNode.remove();
}

function eliminarPerfil(button){
  if (confirm("Vols eliminar el perfil?")) {
    var nav = document.getElementsByClassName("tablinks active")[0];
    nav.previousElementSibling.click();
    button.parentNode.remove();
    nav.remove();
  }
}


function afegirPort(button){
    var nouPort = document.createElement("li");
    nouPort.innerHTML='<input type="number" value=""><select><option selected>TCP</option><option>UDP</option></select><button onclick="eliminarPort(this)">X</button>';
    button.parentNode.parentNode.insertBefore(nouPort, button.parentNode);
}

function afegirDomini(button){
    var nouDomini = document.createElement("tr");
    nouDomini.innerHTML = '<td><button onclick="eliminarPort(this.parentNode)">X</button></td><td><input type="text" identificador="nomDomini"></td><td><input type="checkbox" identificador="checkboxSubdominis"></td>';
    button.parentNode.parentNode.parentNode.insertBefore(nouDomini, button.parentNode.parentNode);
}

function identificarme(button){
    document.getElementById("formAcces").setAttribute("style","margin-top: 80; margin-bottom: 80;");
    button.parentNode.parentNode.remove();
}

function obrir(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

function canviEstat(btn){
  btn.className= btn.className=="verd" ? "vermell": "verd";
}

var spinner;
function adminToJson(){
  password=getPassword();
  accessPassword=document.getElementById("adminPass").innerText;
  httpTransparent=document.getElementById("http").checked;
  httpsTransparent=document.getElementById("https").checked;
  deshabilitarPorts=document.getElementById("disable").checked;
  portsOberts = getOpenPorts();
  perfils = getProfiles();
  spinner=document.getElementById("contenidorSpinnerGlob");
  spinner.style="display: flex;";

  payload = {
    accessPassword: accessPassword,
    password: password,
    http: httpTransparent,
    https: httpsTransparent,
    bloqPorts: deshabilitarPorts,
    openPorts: portsOberts,
    profiles: perfils
  }

  fetch('/saveConfig', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    spinner.style="display: none;";
    setTimeout(()=>{
      if(response.status==200){
        alert("Els canvis s'han guardat correctament.");
        if(password!='') document.getElementById("adminPass").innerText = password;
      }  
      else
        response.text().then(function (text) {
          alert("Error en aplicat els canvis:\n"+text);
        }); 
  },100);
  })
}

function getPassword(){
  var pw1 = document.getElementById("pw1").value;
  var pw2 = document.getElementById("pw2").value;
  if(pw1!=pw2){
    alert("Les contrasenyes no coincideixen.");
    throw 'Les contrasenyes no coincideixen.';
  }
  if(pw1.length < 8 && pw1!=""){
    alert("Introdueix una contrasenya de 8 caràcters de longitud com a mínim.");
    throw 'Contrasenya feble';
  }
  return pw1;
}

function getOpenPorts(){
  var selector = document.getElementById("portSelector");
  var ports = selector.getElementsByTagName("input");
  var protocols = selector.getElementsByTagName("select");
  var array = [];
  for(var i=0; i<ports.length; i++){
    array.push({
      port: ports[i].value,
      tcp: protocols[i].options[protocols[i].selectedIndex].text == "TCP"
    })
  }
  return array;
}

function getProfiles(){
  var tabs = document.getElementsByClassName("tabcontent");
  var perfils = [];
  for(var i=0; i<tabs.length; i++){
    var name = tabs[i].getElementsByTagName("h2")[0].innerHTML;
    perfils.push({
      id: tabs[i].id,
      name: name,
      pin: getPin(tabs[i],name),
      domains: getSubdomains(tabs[i], name),
      keywords: tabs[i].getElementsByTagName("textarea")[0].value.trim().split(/\s+/),
      bloquedHours: getHours(tabs[i])
    });
  }
  return perfils;
}

function getPin(taula, name){
  var pins = taula.getElementsByClassName("inputPin");
  if(pins.length>0){
    var pin= pins[0].value;
    if(pin.length<8){
      alert("La clau d'accés per "+name+" és molt feble. Com a mínim ha de tenir 8 caràcters.");
      throw("Pin feble per "+name);
    }
    return pin;
  }
  else
    return null;
}

function getHours(taula){
  var vermells = taula.getElementsByClassName("horari")[0].getElementsByClassName("vermell");
  var hores = [];
  for(var i=0;i<vermells.length;i++){
    hores.push(vermells[i].getAttribute("identificador"));
  }
  return hores;
}
function getSubdomains(taula){
  let inputs = taula.getElementsByClassName("taulaDominis")[0].getElementsByTagName("input");
  var array=[];
  for(var i=0;i<inputs.length;i+=2){
    array.push({
      domini: inputs[i].value,
      subdominis: inputs[i+1].checked,
    })
  }
  return array;
}

function afegiriPerfil(button){
  let perfil = prompt("Entra el nom del nou perfil", "");
  let perfilId = perfil.replace(/ /g,'');
  let existeix =  document.getElementById(perfilId)!=null;
  if (perfil == null || perfil=="") {
    alert("Entra un nom vàlid.");
    return;
  }
  
  if (existeix) {
    alert("El perfil ja existeix.");
    return;
  }
  var nouTab = document.createElement("button");
  nouTab.className="tablinks";
  nouTab.setAttribute("onclick","obrir(event, '"+perfilId+"')");
  nouTab.innerText=perfil;
  button.parentNode.insertBefore(nouTab, button);

  //Copia la config general
  let general = document.getElementById("UNA");
  var nouDiv = document.createElement("div");
  nouDiv.className="tabcontent";
  nouDiv.id=perfilId;
  nouDiv.innerHTML=general.innerHTML;
  document.getElementById("perfils").appendChild(nouDiv);

  //Afegeix opcions concretes
  var pin = document.createElement("div");
  pin.className="pinAcc";
  pin.innerHTML='<label>Clau accés:</label><span style="width: 10px;"></span><input type="text" value="" class="inputPin">';
  var h2 =nouDiv.getElementsByTagName("h2")[0]
  h2.innerText=perfil;
  nouDiv.insertBefore(pin,h2.nextSibling);
  nouDiv.innerHTML+='<img class="eliminarPerfil" src="/eliminar.png" height="30px" onclick="eliminarPerfil(this)"></img>';

  //Copia els valors entrats
  var generalInputs = general.getElementsByTagName("input");
  var nouInputs = nouDiv.getElementsByTagName("input");
  for(var i=0;i<generalInputs.length;i++){
      nouInputs[i+1].value = generalInputs[i].value;
      nouInputs[i+1].checked = generalInputs[i].checked;
  }

  var genTextArea = general.getElementsByTagName("textarea");
  var nouTextArea = nouDiv.getElementsByTagName("textarea");
  for(var i=0;i<genTextArea.length;i++){
    nouTextArea[i+1].value = genTextArea[i].value;
  }

}

function canviarFC(taula, x, esFila){
  var r=1;
  var nou;
  if(esFila){
    nou = taula.rows[x].cells[r].className == "verd" ? "vermell" : "verd";
    while((cell=taula.rows[x].cells[r++]) && taula.rows[x].cells[r])
    {
      cell.className=nou;
    }
  }
  else{
    nou = taula.rows[r].cells[x].className == "verd" ? "vermell" : "verd";
    while(row=taula.rows[r++])
    {
      row.cells[x].className=nou;
    }
  }
}
