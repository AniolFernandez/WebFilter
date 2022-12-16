from flask import Flask, render_template, request
from threading import Lock, Timer
from config import *
import os


# Inicialització
app = Flask(__name__,
            static_url_path='',
            static_folder='resources/',
            template_folder='templates/')

os.chdir("/usr/local/webapp")
IPADDR="192.168.0.1"
ADMIN = "Administració del filtre web"
DENEGAT = "Accés denegat"
REDIRECT = "Redirecció"
CONFIG = loadConfig()
_45MIN_EN_SEG = 45*60
authenticatedIps = {}
mutex = Lock()

# Endpoints
@app.route('/')
def main(wrongPassword=False):
    return render_template('login.html', titol=ADMIN, wrongPassword=wrongPassword)

@app.route('/configuracio', methods=['POST'])
def config():
    plainTextPassword = request.form['password']
    if CONFIG.adminPasswordMatch(plainTextPassword):
        return render_template('config.html', titol=ADMIN, IP=IPADDR, password=plainTextPassword, config=CONFIG)
    else:
        return main(True)

@app.route('/denegat')
def denegat(wrongPassword=False, url=None):
    return render_template('denied.html', titol=DENEGAT, users=filter(lambda x: x.id!="UNA",CONFIG.profiles), wrongPassword=wrongPassword, url=url if url else request.args.get('url'))

@app.route('/autenticar', methods=['POST'])
def authenticate():
    userId=request.form['profileId']
    url=request.form['url']
    #Autentica el perfil
    if(CONFIG.profilePasswordMatch(userId, request.form['password'])):
        #Obté l'adreça IP la que assignar el perfil
        ipAddr=request.remote_addr
        if userId not in authenticatedIps:
            authenticatedIps[userId] = []
        authenticatedIps[userId].append(ipAddr)
        
        #Reload de la config
        __reloadSquidConfig()
        print(f"User {userId} authenticated at {ipAddr}")

        #Schedule: desautenticar l'usuari al cap de 45min
        Timer(_45MIN_EN_SEG, __removeAuthenticatedIp, [userId,ipAddr]).start()
        return render_template('redirect.html', titol=REDIRECT, url=url)
    else:
        return denegat(True, url)

@app.route('/saveConfig', methods=['POST'])
def saveConfig():
    try:
        __processarPeticio(request.json)
        return "OK", 200
    except Exception as error:
        return str(error), 400

# Funcions privades
def __removeAuthenticatedIp(id, ip):
    try:
        print(f"Timeout for id:{id} at {ip}")
        authenticatedIps[id].remove(ip)
        __reloadSquidConfig()
    except:
        pass

def __processarPeticio(dades):
    # Comprovem password
    global CONFIG
    if not CONFIG.adminPasswordMatch(dades['accessPassword']):
        raise Exception("Ha fallat l'autenticació de l'usuari administrador.")

    #Generem la nova configuració
    novaConfig = Config(dades, CONFIG.adminPassword)

    #Guardem la configuració i l'assignem com a l'actual
    storeConfig(novaConfig)
    CONFIG=novaConfig
    
    #Reload dels serveis i iptables
    __reloadSquidConfig()
    __reloadIptables()

def __reloadSquidConfig(restart=False):
    mutex.acquire()
    try:
        #Obté la config d'squid
        configSquid = CONFIG.configSquid(authenticatedIps)

        #Sobreescriu la config 
        with open("/etc/squid/conf.d/configuracio.conf", "w") as f:
            f.writelines(configSquid)

        #Demana al servei pel reinici
        os.system(f"sudo ./reloadRestart.py {'restart' if restart else 'reload'}")
    except Exception as error:
        print(str(error))
    mutex.release()

def __reloadIptables():
    allowedPorts=""
    https = "true" if CONFIG.enableHttps else "false"
    if CONFIG.blockPorts:
        for portProtocol in CONFIG.allowedPorts:
            try:
                port = int(portProtocol.port)
                allowedPorts+=str(port)+'/'+("tcp" if portProtocol.tcp else "udp")+" "
            except:
                print(f"{portProtocol.port} is not a port")
    os.system(f"sudo ./configurar.py {https} {allowedPorts}")

if __name__ == '__main__':
    __reloadSquidConfig(True)
    __reloadIptables()
    app.run(host=IPADDR, port=8080)

   
