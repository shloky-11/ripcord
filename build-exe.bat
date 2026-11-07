@echo off
title Ripcord - Native Windows .exe Generator
color 0B

echo =========================================================
echo    Ripcord Windows Native Executable (.exe) Compiler
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/2] Compiling Ripcord.exe using Windows .NET runtime...

powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Diagnostics; using System.IO; using System.Windows.Forms; class Program { [STAThread] static void Main() { string dir = AppDomain.CurrentDomain.BaseDirectory; string batPath = Path.Combine(dir, \"run.bat\"); if (!File.Exists(batPath)) { MessageBox.Show(\"run.bat not found in \" + dir, \"Ripcord Error\", MessageBoxButtons.OK, MessageBoxIcon.Error); return; } ProcessStartInfo psi = new ProcessStartInfo(\"cmd.exe\", \"/c \"\"\" + batPath + \"\"\"\"); psi.WorkingDirectory = dir; psi.UseShellExecute = true; Process.Start(psi); } }' -ReferencedAssemblies 'System.Windows.Forms.dll' -OutputAssembly 'Ripcord.exe'"

if exist "Ripcord.exe" (
    echo.
    echo =========================================================
    echo  SUCCESS: Ripcord.exe has been compiled and is ready!
    echo  You can now double-click Ripcord.exe to launch!
    echo =========================================================
    echo.
) else (
    echo.
    echo [ERROR] Compilation failed.
)

pause
