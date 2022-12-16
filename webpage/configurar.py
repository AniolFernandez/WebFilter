#!/bin/python3
import os
import sys

def main(activar_https, rules):
    #Reset de les regles
    os.system("iptables -F")
    os.system("iptables -t nat -F")

    hiHaRegles=len(rules) > 0
    #Bloqueig de tots els ports a excepció dels especificats
    if hiHaRegles:
        for port, proto in [ (pair.split("/")) for pair in rules ]:
            port = int(port)
            proto = "tcp" if proto == "tcp" else "udp" #Check de seguretat
            if 0 < port <= 65535:
                os.system(f"iptables -A FORWARD -o enp0s3 -p {proto} --dport {port} -j ACCEPT")
        os.system(f"iptables -A FORWARD -o enp0s3 -s 0/0 -j DROP")
    
    #Activa NAT
    os.system("iptables -t nat -A POSTROUTING -o enp0s3 -j MASQUERADE")

    #Redirigeix el tràfic del port 80 de l'IP del router cap al port de la webapp
    os.system("iptables -t nat -I PREROUTING -p tcp --dport 80 -d 192.168.0.1 -j REDIRECT --to-port 8080")

    #Redirecció http i https
    if not hiHaRegles or "80/tcp" in rules:
        os.system("iptables -t nat -I PREROUTING -p tcp --dport 80 ! -d 192.168.0.1 -j REDIRECT --to-port 1234")
    if activar_https and (not hiHaRegles or "443/tcp" in rules):
        os.system("iptables -t nat -I PREROUTING -p tcp --dport 443 ! -d 192.168.0.1 -j REDIRECT --to-port 1235")
            

if __name__ == "__main__":
    if len(sys.argv) <= 1:
        print(f"Usage: {sys.argv[0]} <enable_https [true/false]> <port/proto...>")
        sys.exit(1)
    main(sys.argv[1].lower() == "true", sys.argv[2:])