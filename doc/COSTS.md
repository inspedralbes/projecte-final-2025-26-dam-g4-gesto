# Estudi de Costos - Projecte Gesto

Aquest document detalla els costos associats al desenvolupament, posada en marxa i manteniment de la plataforma Gesto.

## 💰 1. Costos de Desenvolupament (Mà d'obra)

El desenvolupament s'ha realitzat durant un període de **3 mesos** per un equip de **4 programadors**.

| Rol | Hores Estím. | Preu/Hora | Total |
|-----|--------------|-----------|-------|
| Desenvolupador Fullstack (x2) | 480h (240h/pers) | 25€ | 12.000€ |
| Dissenyador UI/UX (Rols compartits) | 40h | 25€ | 1.000€ |
| **TOTAL MÀ D'OBRA** | | | **13.000€** |

## 🏗️ 2. Costos d'Infraestructura (Anual)

Utilitzem una infraestructura basada en el núvol per garantir la disponibilitat 24/7.

| Concepte | Proveïdor | Cost Mensual | Cost Anual |
|----------|-----------|--------------|------------|
| Servidor VPS (4 vCPU, 8GB RAM) | Hetzner Cloud | 12,00€ | 144,00€ |
| Domini (.com / .cat) | DonDominio | 1,25€ | 15,00€ |
| Certificats SSL | Let's Encrypt | 0,00€ | 0,00€ |
| **TOTAL INFRAESTRUCTURA** | | **13,25€** | **159,00€** |

## 📉 3. Resum de Costos

### Cost Inicial de Llançament
Inclou el desenvolupament i el primer mes d'infraestructura:
**Total: 13.013,25€**

### Cost de Manteniment Mensual
Inclou el servidor i petites tasques de manteniment:
**Total: ~50,00€/mes** (incloent hores de suport tècnic)

## 🚀 4. Escalabilitat
Gràcies a l'ús de Docker, si el projecte creix, el cost d'infraestructura augmentarà proporcionalment al nombre d'usuaris, però el cost de desenvolupament es reduirà ja que la base tecnològica ja està establerta.
