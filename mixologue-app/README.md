# Le Mixologue 

## Déploiement sur Vercel

### 1. Prérequis
- Compte GitHub (gratuit) : github.com
- Compte Vercel (gratuit) : vercel.com
- Clé API Anthropic : console.anthropic.com

### 2. Étapes

1. **GitHub** : Créez un nouveau repository et uploadez tous ces fichiers
2. **Vercel** : Connectez votre compte GitHub, importez le repository
3. **Variable d'environnement** : Dans Vercel > Settings > Environment Variables, ajoutez :
   - Nom : `ANTHROPIC_API_KEY`
   - Valeur : votre clé API (commence par `sk-ant-...`)
4. **Deploy** : Cliquez sur Deploy — votre app sera live en 2 minutes !

### Structure des fichiers
```
mixologue-app/
├── index.html          # Point d'entrée HTML
├── package.json        # Dépendances
├── vite.config.js      # Configuration Vite
├── vercel.json         # Configuration Vercel
├── src/
│   ├── main.jsx        # Point d'entrée React
│   └── App.jsx         # Votre app (3977 lignes)
├── api/
│   └── claude.js       # Proxy API sécurisé
└── public/
    └── manifest.json   # Configuration PWA
```

### PWA (installation sur iPad/iPhone)
Après déploiement, ouvrez l'URL dans Safari sur iPad :
- Appuyez sur le bouton Partager
- Choisissez "Ajouter à l'écran d'accueil"
- L'app s'ouvre en plein écran comme une app native !
