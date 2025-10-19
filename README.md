# Autapex - Araç Filo Yönetim Sistemi

Modern ve kullanıcı dostu araç filo yönetim sistemi. Next.js, TypeScript, Tailwind CSS ve Supabase kullanılarak geliştirilmiştir.

## 🚀 Özellikler

- 📊 **Gösterge Paneli**: Filo durumu ve istatistikler
- 🚗 **Araç Yönetimi**: Araç ekleme, düzenleme, silme
- 👥 **Personel Yönetimi**: Personel bilgileri ve durumları
- 📋 **İşlem Takibi**: Yakıt, bakım ve diğer işlemler
- 🌙 **Tema Desteği**: Açık/koyu tema
- 📱 **Responsive Tasarım**: Mobil ve desktop uyumlu
- 🔐 **Güvenlik**: Supabase Row Level Security

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Redux Toolkit
- **UI Components**: Custom components with Tailwind

## 📦 Kurulum

### 1. Projeyi klonlayın
```bash
git clone <repository-url>
cd autapex
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Environment Variables
`.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Supabase Kurulumu
1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. SQL Editor'de `supabase/migrations/000_complete_setup.sql` dosyasını çalıştırın
4. Project Settings > API'den URL ve anahtarları alın

**Not**: Backend dosyaları `supabase/` klasöründe organize edilmiştir. Detaylı bilgi için `supabase/README.md` dosyasını inceleyin.

### 5. Geliştirme sunucusunu başlatın
```bash
npm run dev
```

## 🗄️ Veritabanı Şeması

### Tablolar
- **users**: Kullanıcı bilgileri ve rolleri
- **vehicles**: Araç bilgileri ve durumları
- **personnel**: Personel bilgileri
- **transactions**: İşlem kayıtları (yakıt, bakım, vb.)

### İlişkiler
- `transactions.vehicle_id` → `vehicles.id`
- `transactions.personnel_id` → `personnel.id`

## 🔧 Kullanım

### Utility Fonksiyonları
```typescript
import { vehicleUtils, personnelUtils, transactionUtils } from '@/lib/supabase-utils'

// Araç işlemleri
const vehicles = await vehicleUtils.getAllVehicles()
const vehicle = await vehicleUtils.getVehicleByPlate('34ABC123')

// Personel işlemleri
const personnel = await personnelUtils.getAllPersonnel()

// İşlem kayıtları
const transactions = await transactionUtils.getAllTransactions()
```

## 🎨 Tema Sistemi

Redux ile tema yönetimi:
```typescript
import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme } from '@/redux/sliceses/themeSlice'

const theme = useSelector((state: RootState) => state.theme.theme)
const dispatch = useDispatch()

// Tema değiştirme
dispatch(toggleTheme())
```

## 📱 Responsive Tasarım

- **Desktop**: Sol sidebar navigation
- **Mobile**: Alt navigation bar + üst header
- **Tablet**: Responsive sidebar

## 🔐 Güvenlik

- Row Level Security (RLS) politikaları
- Role-based access control
- Supabase Auth entegrasyonu

## 🚀 Deployment

### Vercel (Önerilen)
1. GitHub'a push edin
2. Vercel'de yeni proje oluşturun
3. Environment variables'ları ayarlayın
4. Deploy edin

### Diğer Platformlar
- Netlify
- Railway
- DigitalOcean App Platform

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

# Transportation Management System

## Railway Deployment Konfigürasyonu

### Backend Environment Variables (Railway)
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here-32-chars-minimum
DB_HOST=your-railway-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
FRONTEND_URL=https://your-frontend-domain.railway.app
PORT=5000
```

### Frontend Environment Variables (Railway)
```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_SERVER_API1=https://your-backend-domain.railway.app
```

### Railway Deployment Adımları

#### Backend Deployment
1. Railway.app'da yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. `autapex-backend` klasörünü root directory olarak ayarlayın
4. Environment variables'ları yukarıdaki gibi tanımlayın
5. Deploy edin

#### Frontend Deployment  
1. Railway.app'da yeni proje oluşturun
2. GitHub repository'nizi bağlayın
3. `autapex` klasörünü root directory olarak ayarlayın
4. Environment variables'ları yukarıdaki gibi tanımlayın
5. Deploy edin

### 403 Forbidden Hatası Çözümü

Bu hata genellikle JWT token sorunlarından kaynaklanır:

#### 1. JWT_SECRET Kontrolü
- Backend ve frontend'de aynı JWT_SECRET kullanıldığından emin olun
- Railway'de environment variable'ın doğru tanımlandığını kontrol edin
- JWT_SECRET en az 32 karakter olmalı

#### 2. Token Geçerliliği
```javascript
// Browser console'da token kontrol edin:
const token = localStorage.getItem('token');
console.log('Token:', token);

// Token decode edin:
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('Token expiry:', new Date(payload.exp * 1000));
```

#### 3. API URL Kontrolü
```javascript
// Console'da API URL'ini kontrol edin:
console.log('API Base URL:', process.env.NEXT_PUBLIC_SERVER_API1);
```

#### 4. CORS Kontrolü
Backend'de CORS ayarlarını kontrol edin:
```javascript
// app.js içinde frontend domain'iniz var mı?
origin: [
  'https://your-frontend-domain.railway.app', // Buraya frontend URL'inizi ekleyin
  // ... diğer domain'ler
]
```

### Debugging Adımları

#### 1. Railway Logs
```bash
# Backend logs
railway logs --service backend-service-name

# Frontend logs  
railway logs --service frontend-service-name
```

#### 2. Browser Network Tab
1. Browser Developer Tools açın
2. Network tab'ına gidin
3. API request'lerin status kodlarını kontrol edin
4. Request headers'da Authorization header'ın var olduğunu kontrol edin

#### 3. Token Durumu
```javascript
// Console'da çalıştırın:
const token = localStorage.getItem('token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp < Math.floor(Date.now() / 1000);
    console.log('Token expired:', isExpired);
    console.log('Expires at:', new Date(payload.exp * 1000));
  } catch (e) {
    console.error('Invalid token format');
  }
} else {
  console.log('No token found');
}
```

### Common Issues & Solutions

#### Issue: 403 Forbidden
**Solution:**
1. JWT_SECRET environment variable'ının backend'de tanımlı olduğunu kontrol edin
2. Token'ın localStorage'da var olduğunu kontrol edin
3. Token'ın süresi dolmamış olduğunu kontrol edin
4. API request'lerde Authorization header'ın doğru gönderildiğini kontrol edin

#### Issue: Network Error
**Solution:**
1. Backend service'inin çalıştığını kontrol edin
2. Frontend'de API URL'inin doğru olduğunu kontrol edin
3. CORS ayarlarını kontrol edin

#### Issue: Token Expired
**Solution:**
1. Logout yapıp tekrar login olun
2. JWT token süresini uzatmayı düşünün (backend/authController.js)

### Deployment Checklist
- [ ] Backend environment variables tanımlandı
- [ ] Frontend environment variables tanımlandı  
- [ ] CORS konfigürasyonu güncellendi
- [ ] JWT_SECRET tutarlı olduğu kontrol edildi
- [ ] Database bağlantısı test edildi
- [ ] API endpoint'leri test edildi
- [ ] Authentication flow test edildi
