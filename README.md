# Soul Sync 🌟

**Soul Sync** is an AI-powered dating and connection app that blends cutting-edge technology with ancient wisdom. It uses **AI Vector Embeddings** to match personalities and **Astrology (Western & Tử Vi)** to calculate deep compatibility.

> [!TIP]
> This project is built with **Expo SDK 55**, **Convex**, and **Clerk**.

---

## 🚀 Hướng dẫn cho Team (Quick Start)

Chào mừng bạn đã tham gia phát triển **Soul Sync**! Đây là các bước để bạn setup môi trường và bắt đầu code cùng mình:

### 1. Clone & Cài đặt
```bash
git clone https://github.com/RenE2703/CSBU106.Q21.KHBC.git
cd CSBU106.Q21.KHBC
pnpm install
```

### 2. Cấu hình Biến môi trường (Environment Variables)
Tạo file `.env.local` ở thư mục gốc và copy nội dung từ `.env.example`. Bạn cần điền các key sau:

- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Lấy từ Clerk Dashboard.
- `EXPO_PUBLIC_CONVEX_URL`: Sau khi chạy lệnh `npx convex dev` ở bước 3, bạn sẽ có URL này.

### 3. Chạy Backend (Convex)
Mở một terminal mới và chạy:
```bash
npx convex dev
```
Lệnh này sẽ tự động deploy các function lên cloud và giữ cho backend luôn đồng bộ với code local của bạn.

### 4. Chạy Frontend (Expo)
Sau khi backend đã sẵn sàng, chạy app:
```bash
pnpm start
```
Quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android) hoặc Camera (iOS).

---

## 🛠 Tech Stack

- **Frontend**: React Native (Expo SDK 55), Expo Router, Reanimated 4, Glassmorphism UI.
- **Backend**: Convex (Real-time DB & Cloud Functions).
- **Auth**: Clerk.
- **AI**: Google Gemini (Embeddings & Astrology Logic).
- **Styling**: NativeWind (Tailwind CSS for Native).

---

## 🧬 Tính năng cốt lõi

- **AI Matching**: Chuyển Bio và sở thích thành Vector 3072 chiều để tìm người có "tần số" tương đương.
- **Astrology Engine**: Tính toán cung hoàng đạo và Tử Vi (Can Chi, Bản Mệnh) tự động dựa trên ngày giờ sinh.
- **Daily Picks**: Mỗi ngày gợi ý 3 người đặc biệt nhất kèm giải thích từ AI lý do tại sao bạn nên match với họ.
- **Real-time Chat**: Nhắn tin tức thời không độ trễ.

---

## 🧪 Seeding Dữ liệu (Dành cho Dev)

Để có 100+ hồ sơ Celeb Việt Nam để test tính năng Quẹt (Discover), hãy chạy lệnh:
```bash
npx convex run seed:seedCelebs
```

---

## 🤝 Quy tắc đóng góp

1. **Branching**: Tạo branch mới cho mỗi tính năng (`feat/analytics`, `fix/login-bug`).
2. **Commit**: Viết commit message rõ ràng (Tiếng Anh hoặc Tiếng Việt đều được).
3. **Sync Backend**: Luôn đảm bảo `npx convex dev` đang chạy khi bạn thay đổi các file trong thư mục `convex/`.

---

**Soul Sync - Kết nối Tâm hồn bằng Công nghệ và Tinh tú.**
Built with ❤️ by RenE2703 & Team.
