Unicode true
!include "MUI2.nsh"
!define APP "СайтКонструктор"
!define VER "1.0.0"
!define REGU "Software\Microsoft\Windows\CurrentVersion\Uninstall\SiteBuilder"
!define WVKEY "Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
Name "${APP} ${VER}"
OutFile "..\dist\SiteBuilder-Setup-1.0.0.exe"
InstallDir "$LOCALAPPDATA\Programs\SiteBuilder"
InstallDirRegKey HKCU "Software\SiteBuilder" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
VIProductVersion "1.0.0.0"
VIAddVersionKey /LANG=1049 "ProductName" "СайтКонструктор"
VIAddVersionKey /LANG=1049 "FileDescription" "Установщик СайтКонструктора"
VIAddVersionKey /LANG=1049 "FileVersion" "1.0.0"
VIAddVersionKey /LANG=1049 "ProductVersion" "1.0.0"
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TEXT "Программа установит СайтКонструктор ${VER} — визуальный конструктор сайтов с ИИ.$\r$\n$\r$\nГотовый сайт сохраняется обычной папкой для загрузки на любой хостинг.$\r$\n$\r$\nПрава администратора не требуются."
!define MUI_FINISHPAGE_RUN "$INSTDIR\SiteBuilder.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Запустить СайтКонструктор"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_COMPONENTS
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Russian"
Function CheckWebView2
  ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\${WVKEY}" "pv"
  StrCmp $0 "" 0 +2
  ReadRegStr $0 HKLM "SOFTWARE\${WVKEY}" "pv"
  StrCmp $0 "" 0 +2
  ReadRegStr $0 HKCU "Software\${WVKEY}" "pv"
  StrCmp $0 "0.0.0.0" 0 +2
  StrCpy $0 ""
  StrCmp $0 "" 0 found
  DetailPrint "WebView2 Runtime не найден — запускаю установщик Microsoft (нужен интернет)…"
  SetOutPath "$PLUGINSDIR"
  File "MicrosoftEdgeWebview2Setup.exe"
  ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $1
  StrCmp $1 "0" done
  MessageBox MB_ICONEXCLAMATION "Не удалось установить Microsoft Edge WebView2 Runtime (код $1).$\r$\nУстановите вручную: https://go.microsoft.com/fwlink/p/?LinkId=2124703"
  Goto done
  found:
  DetailPrint "WebView2 Runtime найден: $0"
  done:
FunctionEnd
Section "СайтКонструктор (обязательно)" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  File "..\out\SiteBuilder\SiteBuilder.exe"
  File "..\README-RU.txt"
  File "app.ico"
  Call CheckWebView2
  SetOutPath "$INSTDIR"
  WriteRegStr HKCU "Software\SiteBuilder" "InstallDir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateDirectory "$SMPROGRAMS\СайтКонструктор"
  CreateShortcut "$SMPROGRAMS\СайтКонструктор\СайтКонструктор.lnk" "$INSTDIR\SiteBuilder.exe" "" "$INSTDIR\app.ico"
  CreateShortcut "$SMPROGRAMS\СайтКонструктор\Удалить.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\СайтКонструктор\Инструкция.lnk" "$INSTDIR\README-RU.txt"
  WriteRegStr HKCU "Software\Classes\.sitebuilder" "" "SiteBuilder.Project"
  WriteRegStr HKCU "Software\Classes\SiteBuilder.Project\shell\open\command" "" '"$INSTDIR\SiteBuilder.exe" "%1"'
  WriteRegStr HKCU "${REGU}" "DisplayName" "СайтКонструктор ${VER}"
  WriteRegStr HKCU "${REGU}" "DisplayVersion" "${VER}"
  WriteRegStr HKCU "${REGU}" "Publisher" "СайтКонструктор"
  WriteRegStr HKCU "${REGU}" "DisplayIcon" "$INSTDIR\app.ico"
  WriteRegStr HKCU "${REGU}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${REGU}" "NoModify" 1
  WriteRegDWORD HKCU "${REGU}" "NoRepair" 1
  WriteRegDWORD HKCU "${REGU}" "EstimatedSize" 75000
SectionEnd
Section "Ярлык на рабочем столе" SecDesk
  CreateShortcut "$DESKTOP\СайтКонструктор.lnk" "$INSTDIR\SiteBuilder.exe" "" "$INSTDIR\app.ico"
SectionEnd
Section "un.Программа" UnMain
  SectionIn RO
  Delete "$INSTDIR\SiteBuilder.exe"
  Delete "$INSTDIR\README-RU.txt"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\СайтКонструктор.lnk"
  RMDir /r "$SMPROGRAMS\СайтКонструктор"
  DeleteRegKey HKCU "${REGU}"
  DeleteRegKey HKCU "Software\SiteBuilder"
  DeleteRegKey HKCU "Software\Classes\.sitebuilder"
  DeleteRegKey HKCU "Software\Classes\SiteBuilder.Project"
SectionEnd
Section /o "un.Удалить настройки, автосохранение и входы в ИИ-чаты" UnData
  RMDir /r "$LOCALAPPDATA\SiteBuilder"
SectionEnd
