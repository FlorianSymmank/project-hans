# Idea Manager - Setup Guide

Ein einfacher Ideen-Manager mit Supabase Backend und Vercel Frontend für 2 Nutzer.

## 🚀 Quick Links

- **Supabase Dashboard**: `https://supabase.com/dashboard/project/nehlaaelcbmntddqngzo`
- **Vercel Dashboard**: `https://vercel.com/florian-symmanks-projects/project-hans`
- **Deine Live-App**: `https://project-hans.vercel.app/`

---

## 📋 Setup Checklist

### 1. Supabase Setup

#### Projekt erstellen
1. Gehe zu https://supabase.com
2. Neues Projekt erstellen
3. Warte ~2 Minuten bis DB fertig ist

#### API Keys holen
Gehe zu **Settings** → **API**

Benötigt für `index.html`:
- `SUPABASE_URL`: `https://xxxxx.supabase.co`
- `SUPABASE_ANON_KEY`: `eyJhbGc...` (der lange String)

⚠️ **Wichtig**: Nutze NICHT den `service_role` key!

##### Nutzer erstellen
Gehe zu Authentication → Users → Add user
Erstelle 2 Nutzer:

##### Email + Passwort eingeben
"Auto Confirm User" aktivieren (kein Email-Versand)

##### Registrierung deaktivieren
Gehe zu Authentication → Providers → Email

##### "Enable sign ups" ausschalten
Nur du kannst jetzt Nutzer erstellen!