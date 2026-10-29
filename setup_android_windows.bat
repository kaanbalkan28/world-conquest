@echo off
setlocal
cd /d "%~dp0"
echo === World Conquest Android setup ===
where node >nul 2>nul || (echo ERROR: Node.js LTS kurun: https://nodejs.org/ & pause & exit /b 1)
where npm >nul 2>nul || (echo ERROR: npm bulunamadi. Node.js kurulumunu kontrol edin. & pause & exit /b 1)
if not exist package.json (echo ERROR: package.json bulunamadi. & pause & exit /b 1)
echo [1/3] npm paketleri kuruluyor...
call npm install || (echo ERROR: npm install basarisiz. Internet baglantisini kontrol edin. & pause & exit /b 1)
if not exist android\build.gradle if not exist android\build.gradle.kts (
  echo [2/3] Android projesi olusturuluyor...
  call npx cap add android || (echo ERROR: Capacitor Android projesi olusturulamadi. & pause & exit /b 1)
) else (echo [2/3] Android projesi zaten mevcut.)
echo [3/3] Web dosyalari Android projesine aktariliyor...
call npx cap sync android || (echo ERROR: cap sync basarisiz. & pause & exit /b 1)
echo Yatay ekran kilidi ekleniyor...
powershell -NoProfile -Command "$f='android\app\src\main\AndroidManifest.xml'; $t=Get-Content $f -Raw; if($t -notmatch 'screenOrientation'){ $t=$t -replace '<activity','<activity android:screenOrientation=\"sensorLandscape\"'; Set-Content $f $t -Encoding UTF8 }"
echo.
echo Hazir! Android Studio ile acmak icin: npx cap open android
echo APK olusturmak icin build_debug_apk.bat dosyasini calistirin.
pause
