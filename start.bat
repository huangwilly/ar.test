@echo off
echo 正在啟動AR掃描網站服務器...
echo.
echo 請在瀏覽器中訪問: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服務器
echo.
python -m http.server 8000
pause

