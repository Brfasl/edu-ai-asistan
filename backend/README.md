## Backend (API)

### Lokal (PostgreSQL ile önerilen)

Önce `.env` oluştur:

```bash
cp .env.example .env
```

Sonra Postgres'i ayağa kaldır (Docker Desktop gerekli):

```bash
npm run db:up
```

İlk migration:

```bash
npm run db:migrate
```

API çalıştır:

```bash
npm run dev
```

### Canlı (Production)

- **Veritabanı**: PostgreSQL
- **Gizli değerler**: `.env` dosyasına değil, hosting'in Environment Variables bölümüne
- **Migration**:

```bash
npm run db:deploy
```

