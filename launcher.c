#define UNICODE
#define _UNICODE
#include <windows.h>
#include <shellapi.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    WCHAR exePath[MAX_PATH];
    WCHAR dirPath[MAX_PATH];
    WCHAR cmdLine[4096];
    WCHAR packageJsonPath[MAX_PATH];

    // 1. Get location of Ripcord.exe
    GetModuleFileNameW(NULL, exePath, MAX_PATH);

    // Extract directory
    wcscpy_s(dirPath, MAX_PATH, exePath);
    WCHAR *lastSlash = wcsrchr(dirPath, L'\\');
    if (lastSlash) {
        *lastSlash = L'\0';
    }

    // 2. Check if package.json exists in this folder (ensure user extracted ZIP archive)
    wsprintfW(packageJsonPath, L"%s\\package.json", dirPath);
    DWORD fileAttr = GetFileAttributesW(packageJsonPath);
    if (fileAttr == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(
            NULL,
            L"Ripcord was launched from inside an unextracted ZIP archive.\n\n"
            L"Please right-click the downloaded ZIP file, choose 'Extract All...', "
            L"and run Ripcord.exe from the extracted folder.",
            L"Ripcord - Setup Required",
            MB_ICONWARNING | MB_OK
        );
        return 1;
    }

    // 3. Build command line to execute run.bat
    // This handles Node.js auto-detection, dependencies, and starting the local server
    wsprintfW(cmdLine, L"cmd.exe /c \"\"%s\\run.bat\"\"", dirPath);

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    // Launch run.bat in normal console window so user can see startup & progress
    BOOL success = CreateProcessW(
        NULL,
        cmdLine,
        NULL,
        NULL,
        FALSE,
        CREATE_NEW_CONSOLE,
        NULL,
        dirPath,
        &si,
        &pi
    );

    if (!success) {
        DWORD err = GetLastError();
        WCHAR errMsg[256];
        wsprintfW(errMsg, L"Failed to launch Ripcord engine (Error Code: %lu).\n\nPlease verify run.bat exists in the same folder.", err);
        MessageBoxW(NULL, errMsg, L"Ripcord Error", MB_ICONERROR | MB_OK);
        return 1;
    }

    // Close process handles
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return 0;
}
