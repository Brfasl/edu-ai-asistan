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

### Veriler nerede?

| Veri | Konum |
| --- | --- |
| Belgeler (PDF metadata) | PostgreSQL → `Document` tablosu |
| Analiz (özet, quiz, flashcard) | PostgreSQL → `DocumentAnalysis` tablosu |
| PDF dosyaları | `backend/uploads/<kullanici-id>/` klasörü |

Veritabanını kontrol etmek için:

```bash
npm run db:studio
```

Tarayıcıda tabloları aç: `Document`, `DocumentAnalysis`, `User`.

### Veriler neden silinir?

**Dikkat:** `npm run db:reset` veya `docker compose down -v` PostgreSQL volume'unu siler — tüm belge ve analiz kayıtları gider. PDF dosyaları diskte kalabilir ama analiz geri gelmez.

- Güvenli durdurma: `npm run db:down` (veri kalır)
- Her şeyi silmek: `npm run db:reset` (sadece bilinçli kullan)
- `npx prisma migrate reset` de tüm DB'yi sıfırlar

### Canlı (Production)

- **Veritabanı**: PostgreSQL
- **Gizli değerler**: `.env` dosyasına değil, hosting'in Environment Variables bölümüne
- **Migration**:

```bash
npm run db:deploy
```

