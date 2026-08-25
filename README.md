# ZoneKite

Application mobile pour la communauté de kitesurfeurs d'Île-de-France : recherche de spot (vent + marée), base de spots, covoiturage solidaire, forum.

## Stack technique

- **React Native + Expo** (TypeScript) — une seule base de code pour iOS et Android
- **Firebase** (Auth, Firestore, Storage) — backend sans serveur à gérer

## Démarrer le projet en local

Prérequis : [Node.js](https://nodejs.org) installé sur votre ordinateur, et l'application **Expo Go** installée sur votre téléphone (App Store / Play Store).

```bash
npm install
npm start
```

Un QR code s'affiche dans le terminal : scannez-le avec l'appareil photo de votre iPhone (ou l'app Expo Go sur Android) pour ouvrir l'app sur votre téléphone.

## Structure du projet

```
src/
  theme/        couleurs, typographie (charte graphique ZoneKite)
  navigation/    navigation par onglets (Recherche, Spots, Covoiturage, Forum, Profil)
  screens/       écrans de l'application
  components/    composants réutilisables
  data/          données statiques (ex. base de spots) en attendant le backend
  types/         types TypeScript partagés
```
