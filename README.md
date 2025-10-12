# Ulas Tech - Araç Filo Yönetim Sistemi

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
cd ulas
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
