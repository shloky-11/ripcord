@echo off
title Ripcord Binary Compiler
color 0B

echo =========================================================
echo               Ripcord Windows PE Compiler
echo =========================================================
echo.

cd /d "%~dp0"

echo [1/2] Compiling Ripcord.exe via Roslyn CodeDOM provider...

powershell -NoProfile -Command "Add-Type -TypeDefinition 'using System; using System.Diagnostics; using System.IO; using System.Windows.Forms; class Program { [STAThread] static void Main() { string dir = AppDomain.CurrentDomain.BaseDirectory; string batPath = Path.Combine(dir, \"run.bat\"); if (!File.Exists(batPath)) { MessageBox.Show(\"run.bat not found in \" + dir, \"Ripcord Error\", MessageBoxButtons.OK, MessageBoxIcon.Error); return; } ProcessStartInfo psi = new ProcessStartInfo(\"cmd.exe\", \"/c \"\"\" + batPath + \"\"\"\"); psi.WorkingDirectory = dir; psi.UseShellExecute = true; Process.Start(psi); } }' -ReferencedAssemblies 'System.Windows.Forms.dll' -OutputAssembly 'Ripcord.exe'"

if exist "Ripcord.exe" (
    echo.
    echo Ripcord.exe built successfully.
) else (
    echo.
    echo [ERROR] Build failed.
)

pause
