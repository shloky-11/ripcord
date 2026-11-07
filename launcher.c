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

    // Resolve binary path and working directory
    GetModuleFileNameW(NULL, exePath, MAX_PATH);
    wcscpy_s(dirPath, MAX_PATH, exePath);
    WCHAR *lastSlash = wcsrchr(dirPath, L'\\');
    if (lastSlash) {
        *lastSlash = L'\0';
    }

    // Guard against running directly inside an unextracted zip virtual container
    wsprintfW(packageJsonPath, L"%s\\package.json", dirPath);
    DWORD fileAttr = GetFileAttributesW(packageJsonPath);
    if (fileAttr == INVALID_FILE_ATTRIBUTES) {
        MessageBoxW(
            NULL,
            L"Ripcord cannot run from within a compressed archive.\n\n"
            L"Extract the entire folder before launching Ripcord.exe.",
            L"Ripcord - Archive Extraction Required",
            MB_ICONWARNING | MB_OK
        );
        return 1;
    }

    // Forward invocation to run.bat to handle node environment validation and startup
    wsprintfW(cmdLine, L"cmd.exe /c \"\"%s\\run.bat\"\"", dirPath);

    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

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
        wsprintfW(errMsg, L"Failed to spawn background process (error code %lu).\nVerify run.bat is present in the working directory.", err);
        MessageBoxW(NULL, errMsg, L"Ripcord - Launch Error", MB_ICONERROR | MB_OK);
        return 1;
    }

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return 0;
}
