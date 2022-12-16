#!/bin/sh

#Instalem squid i dependències de python
apt-get update -y
apt-get install squid squid-openssl iptables-persistent apache2 python3-pip -y
pip3 install flask==2.2.2

#Configuració bàsica
config=/etc/squid
dir=$(dirname "$0")
cat $dir/squid.conf > $config/squid.conf # Sobreescrivim el fitxer de config
chmod 644 $config/squid.conf

#Plantilles d'error
mkdir /usr/share/squid/errors/personalitzats
cp -f $dir/errors/* /usr/share/squid/errors/personalitzats/
chmod 644 /usr/share/squid/errors/personalitzats/*

#Còpia la webapp
mkdir /usr/local/webapp
cp -f -R $dir/webpage/* /usr/local/webapp/

#Generem certificats per SSL
openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout $conf/bump.key -out $conf/bump.crt -subj "/C=ES/ST=Catalunya/L=Girona/O=UdG/OU=CXMSI/CN=aniolsergi.isp"
openssl dhparam -outform PEM -out $conf/bump_dhparam.pem 2048
openssl x509 -in $conf/bump.crt -outform DER -out $conf/bump.der  #certificat a exportar
cp -f $conf/bump.der /usr/local/webapp/resources/cert.der

#Creem l'usuari per la webapp
useradd webapp_aniolsergi

#Especifiquem els permisos dels scripts i fitxers
chown webapp_aniolsergi:webapp_aniolsergi -R /usr/local/webapp/
find /usr/local/webapp/ -type d -exec chmod 755 {} \;
find /usr/local/webapp/ -type f -exec chmod 644 {} \;
find /usr/local/webapp/ -type f -name "*.py" -exec chmod 754 {} \;
chown root:root -R /usr/local/webapp/configurar.py
chown root:root -R /usr/local/webapp/reloadRestart.py 
chown webapp_aniolsergi:webapp_aniolsergi -R /etc/squid/conf.d
chmod 755 /etc/squid/conf.d
chmod 644 /etc/squid/conf.d/*

#Permetem a l'usuari webapp_aniolsergi executar com a sudo els fitxers necessaris
echo webapp_aniolsergi ALL = \(root\) NOPASSWD: /usr/local/webapp/configurar.py >> /etc/sudoers
echo webapp_aniolsergi ALL = \(root\) NOPASSWD: /usr/local/webapp/reloadRestart.py >> /etc/sudoers

#Habilitem el servei per l'app
cp -f $dir/filtreweb.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable filtreweb.service
systemctl restart filtreweb.service

#Reinici del router
service squid stop
sudo reboot


# url sslbump definitiva :https://support.kaspersky.com/KWTS/6.1/es-ES/166244.htm
# i https://support.kaspersky.com/KWTS/6.1/es-ES/193662.htm