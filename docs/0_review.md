**Tổng quan**
- Repo đang dùng Webpack 4 để build mã nguồn trong `src` vào thư mục `public`; entry là `src/js/main.js` với cấu hình định nghĩa ở `webpack.config.js:10-83`.
- Game khởi tạo Phaser CE, gắn MobX/Preact để dựng menu và điều hướng state, xem thêm `src/js/main.js:1-87`.
- Tài nguyên (tilemap, âm thanh, shader…) được copy thẳng từ `src/resources` nhờ `CopyWebpackPlugin` trong `webpack.config.js:75-82`.

**Chuẩn bị môi trường**
- Repo đã thêm `.nvmrc` (giá trị `v14.21.3`) nên có thể dùng `nvm use` hoặc `volta` để cố định phiên bản Node.
- Toolchain đã nâng lên `webpack@4.47.0`, `webpack-cli@3.3.12`, `webpack-dev-server@3.11.3` và `sass@1.32.13`; cần Node ≥14 để tránh lỗi thiếu `globalThis`.
- Lần đầu chạy script, nó tự cài `typings@2` vào devDependencies để đáp ứng `postinstall` (`package.json:68` + `typings.json:1-4`).
- Repo đã chuyển từ `node-sass` sang `sass` (dart-sass thuần JS) kết hợp `sass-loader@10`; nếu bạn đã chạy `npm install` trước đó và bị lỗi hãy xoá `node_modules` + `package-lock.json` rồi cài lại.

**Các bước chạy**
- `npm install` (được `./scripts/dev.sh` gọi) để đồng bộ phiên bản mới và tự động tải file định nghĩa Phaser CE qua `typings install`.
- `npm run dev` để mở `webpack-dev-server` ở http://localhost:8080 và tự launch game (`package.json:69-71`); server phục vụ trực tiếp `src/index.html`.
- `npm run build` sẽ tạo bản build production vào `public/main.js` cùng assets (`package.json:69` + `webpack.config.js:14-84`).
- Muốn thử build production ngay trong dev server có thể dùng `npm run serve:production` (`package.json:72`).

**Lưu ý**
- Repo có thêm các file cấu hình Webpack khác (`webpack.dev.js`…) nhưng hiện không được tham chiếu; mặc định `webpack-dev-server` dùng `webpack.config.js`.
- Nếu muốn disable analytics/test runner, chỉnh trong `src/js/analytics` hoặc đặt `PRODUCTION=true` khi chạy để tránh gọi `initializeAnalytics` (`src/js/main.js:9-18`).
- Tôi chưa chạy thử trực tiếp vì môi trường hiện tại bị chặn network nên không thể cài phụ thuộc; hãy xác nhận lại các bước trên máy bạn.
- Script `./scripts/dev.sh` sẽ dừng nếu phát hiện `package-lock.json` vẫn còn `node-sass`; xoá file này (và `node_modules`) trước khi chạy lại để nhận bộ phụ thuộc mới.
- Nếu gặp lỗi `TypeError: Cannot read property 'properties' of undefined` khi chạy dev server, nguyên nhân là lockfile cũ giữ phiên bản webpack-cli/dev-server cũ. Xoá `package-lock.json` + `node_modules/` rồi chạy lại `./scripts/dev.sh` để lấy bản đã được ghim.
- Nếu bạn đang dùng Node 10 và gặp `ReferenceError: globalThis is not defined` (đến từ `sass.dart.js`), hãy chuyển sang Node 14 theo `.nvmrc` mới.
- Nếu webpack báo thiếu `node-sass`, bảo đảm bạn đang dùng lockfile mới (đã cài `sass-loader@10`); xoá `node_modules` + `package-lock.json` và cài lại.
- `phaser2-navmesh` được load từ bundle đã compile (`phaser2-navmesh/dist/phaser2-navmesh-plugin`) và webpack đã cấu hình `babel-loader` xử lý riêng thư mục `dist`; nếu muốn dùng source TS thì phải mở rộng cấu hình loader.
- Tilemap layers giờ khởi tạo với kích thước thật (`tilemap.widthInPixels`, `tilemap.heightInPixels`) để tránh bị crop còn 750×750 khi dùng map lớn.
- Nhấn `U` trong game để bật/tắt overlay debug tĩnh: hiển thị các tile collidable, object layer từ Tiled, navmesh và log snapshot vào console (`StaticDebugger`).

**Next steps**
1. Nếu trước đó đã cài đặt dở dang, xoá `package-lock.json` và `node_modules/`, chạy `nvm install && nvm use` (sẽ lấy Node 14.21.3 từ `.nvmrc`), rồi dùng `./scripts/dev.sh` để cài deps và khởi động dev server.
2. Nếu chạy ổn, cân nhắc chạy `npm audit fix` (nếu phù hợp) rồi commit thay đổi ở `package.json`/`package-lock.json` cùng doc/script để chia sẻ cho team.
