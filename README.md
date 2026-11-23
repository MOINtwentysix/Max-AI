# Max – Personal AI Buddy 🤖

**Max** ist eine moderne, minimalistische und vollständig self-hostbare KI-Begleiter-Applikation. Entwickelt von einem zukunftsorientierten AI Lab, fühlt sich Max nicht wie ein statischer Chatbot an, sondern wie ein persönlicher digitaler Begleiter mit lokalem Langzeitgedächtnis (**Max Memory**), intuitiver Ästhetik und kompromissloser Privatsphäre.

---

## 🌟 Hauptmerkmale

- 🔒 **100% Self-Hosted & Lokal:** Keine Cloud-APIs, keine Telemetrie, keine externen Datenbanken.
- 🦙 **Ollama KI-Backend:** Direkte Anbindung an bestehende Ollama-Instanzen inklusive Token-Streaming und Modellprüfung.
- 🧠 **Dual Processing & Max Memory:**
  - **Pfad A (Conversation Processing):** Schnelles Streaming der Antworten direkt an den Nutzer. Keine persistente Chat-Historie auf der Festplatte (temporärer RAM-Kontext während der Sitzung).
  - **Pfad B (Memory Processing):** Asynchrone Analyse im Hintergrund. Max lernt (`CREATE`), korrigiert (`UPDATE`) oder vergisst (`DELETE`) relevante Fakten automatisch.
  - **1 GB Speicherlimit pro Nutzer:** Echtes Byte-Tracking der gespeicherten Datensätze.
  - Unterscheidung zwischen *Nutzer-Aussagen* (`USER_STATEMENT`) und *Max-Schlussfolgerungen* (`MAX_INFERRED`) samt Vertrauensbewertung (Confidence Score).
- 🎨 **Minimalistisches Muse-Design:**
  - Boomerang-förmiges Maskottchen mit zwei Augen und anpassbaren Farben.
  - Lebendige Denkanimation: Max neigt sich zur Seite und zeigt eine Endlosschleife aus Punkten und einer Denkblase.
  - Light Mode & Dark Mode mit dezenten Schatten und runden Kanten.
  - Vollwertiger Markdown- und Code-Renderer mit Syntaxblöcken und Ein-Klick-Kopierfunktion.
- 👥 **Benutzer- & Rollensystem mit First-Admin-Prinzip:**
  - Der allererste registrierte Account wird **automatisch und dauerhaft als Systemadministrator (`ADMIN`)** eingerichtet.
  - Alle nachfolgenden Registrierungen erhalten die Rolle `USER`.
  - Serverseitige Rollenvergabe & Schutz vor Selbstrechten-Eskalation.
- 🛡️ **Vierter Tab für Administratoren (`Admin`):**
  - **Overview:** Aktive Nutzer, Memory-Gesamtverbrauch, Ollama-Status, Uptime & RAM.
  - **Users:** Nutzer anzeigen, sperren/entsperren, Rollen anpassen, löschen.
  - **Registration:** Umschalten zwischen *Modus A (Öffentlich)* und *Modus B (Einladungscode)*; Codes erstellen und verwalten.
  - **AI Settings:** Ollama-URL, Modell, System-Prompt und Temperatur direkt in der UI konfigurieren.
  - **MCP Management:** Vorbereitung für externe Model Context Protocol Server (Default Limit: 5 Server).
  - **System & Backups:** Konsistente SQLite-Snapshots erstellen und herunterladen; Audit-Protokolle einsehen.

---

## 🚀 Schnellstart mit Docker (1-Befehl-Start)

### 1. Repository klonen und Konfiguration anlegen

```bash
cd max-ai
cp .env.example .env
```

Passe bei Bedarf in `.env` den `JWT_SECRET` und die `OLLAMA_BASE_URL` an.

### 2. Container mit Docker Compose starten

```bash
docker compose up -d --build
```

Max ist nun im Browser erreichbar unter:
👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Ersten Administrator registrieren

Öffne die Anwendung im Browser und klicke auf **"Jetzt registrieren"**.  
Der erste Account wird **automatisch als `ADMIN`** initialisiert und erhält sofort Zugriff auf alle 4 Tabs (**Chat**, **Memory**, **Profile**, **Admin**).

---

## 🛠️ Lokale Entwicklung (ohne Docker)

Falls du Max direkt mit Node.js entwickeln oder testen möchtest:

### Voraussetzungen
- **Node.js:** v20+ (integriertes SQLite `node:sqlite` wird genutzt)
- **Ollama:** Lokal installiert und gestartet (`ollama serve`)

### Schritte

1. **Server starten:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *(Backend läuft auf Port 3000)*

2. **Client starten:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *(Frontend läuft auf Port 5173 mit Proxy auf 3000)*

3. **Produktions-Build des Clients erstellen:**
   ```bash
   cd client
   npm run build
   ```
   *(Wird automatisch vom Express-Server unter `http://localhost:3000` mit ausgeliefert)*

---

## ⚙️ Konfigurationsoptionen (`.env`)

| Variable | Standardwert | Beschreibung |
|---|---|---|
| `PORT` | `3000` | Port der Web-Anwendung |
| `NODE_ENV` | `production` | Laufzeitumgebung |
| `DATA_DIR` | `/app/data` | Pfad für das persistente SQLite-Volume |
| `JWT_SECRET` | *(Zufallsstring)* | Geheimer Schlüssel für Benutzer-Sessions |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | URL zur Ollama-Instanz |
| `OLLAMA_MODEL` | `llama3.2:latest` | Zu verwendendes KI-Modell |

> **Tipp für Linux-Docker:** `host.docker.internal` ist in `docker-compose.yml` über `host-gateway` vorkonfiguriert, sodass Max reibungslos auf das Host-Ollama zugreifen kann.

---

## 📁 Projektarchitektur

```
max-ai/
├── Dockerfile                  # Multi-Stage Dockerfile (Build & Runtime)
├── docker-compose.yml          # Docker Compose mit persistentem Volume
├── .env.example                # Vorlage für Umgebungsvariablen
├── data/                       # Lokaler Speicherort (SQLite DB & Backups)
│
├── server/                     # Backend & API
│   ├── src/
│   │   ├── index.js            # Express Server & Static Serving
│   │   ├── db.js               # SQLite Initialisierung & Schemas
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT Auth & Admin-Rollenprüfung
│   │   ├── routes/
│   │   │   ├── auth.js         # Registrierung, Login, Profil
│   │   │   ├── chat.js         # Pfad A: Streaming Chat & Ollama Anbindung
│   │   │   ├── memory.js       # CRUD für Max Memory & Storage Quota
│   │   │   └── admin.js        # Admin Dashboard & System-APIs
│   │   └── services/
│   │       ├── ollamaService.js           # Ollama Client & Health Check
│   │       ├── memoryService.js           # 1-GB Quota & Speicherlogik
│   │       ├── memoryProcessingService.js # Pfad B: Asynchroner Fakten-Extraktor
│   │       └── auditService.js            # Revisionssicheres Audit-Logging
│   └── package.json
│
└── client/                     # Frontend (Vite + React + Tailwind CSS)
    ├── src/
    │   ├── components/
    │   │   ├── MaxMascot.jsx        # Boomerang-Maskottchen mit Denkanimation
    │   │   ├── Header.jsx           # Muse-Header mit Mascot & Theme-Toggle
    │   │   ├── Navigation.jsx       # Dynamische 3- oder 4-Tab-Leiste
    │   │   ├── MarkdownRenderer.jsx # Code-Highlighting & Markdown
    │   │   └── AuthModal.jsx        # Registrierung & Login Flow
    │   ├── context/
    │   │   └── AuthContext.jsx      # Globale Authentifizierung & Theme State
    │   └── pages/
    │       ├── ChatView.jsx         # Hauptansicht (Streaming Chat)
    │       ├── MemoryView.jsx       # Gedächtnis-Verwaltung & Quota-Balken
    │       ├── ProfileView.jsx      # Farben, Settings & Privatsphäre
    │       └── AdminView.jsx        # Vollständiges Admin Dashboard
    └── package.json
```

---

## 🔒 Sicherheit & Privatsphäre

- Passwörter werden mit **bcrypt** und sicherem Salt gehasht.
- Sessions laufen über signierte **JWTs** mit Ablaufdatum.
- **CSRF-Schutz & Rate-Limiting** auf allen Auth-Endpunkten zur Abwehr von Brute-Force-Angriffen.
- Strikte serverseitige Rollenprüfungen: Keine Chance auf Selbsterhöhung von Rechten.
- Keine sensiblen Daten, Passwörter oder Chat-Inhalte in den System-Logs.
- Revisionssichere Audit-Logs für alle administrativen Aktionen.
