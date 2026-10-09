@echo off
chcp 65001 >nul
echo PRIMAL RUN - balance-simulering paa din egen computer
echo Bruger alle CPU-kerner undtagen en. Det kan tage 10-40 minutter.
echo.
set /p RUNS="Antal seeds pr. art og spillestil [20]: "
if "%RUNS%"=="" set RUNS=20
node "%~dp0tools\playstyle_sim.cjs" --runs %RUNS%
echo.
echo Faerdig. Rapporten ligger i PRIMAL_RUN_Game\balance_runs\playstyle_*
echo Send filen summary_compact.json til Claude.
for /f "delims=" %%d in ('dir /b /ad /o-d "%~dp0PRIMAL_RUN_Game\balance_runs\playstyle_*"') do (start "" "%~dp0PRIMAL_RUN_Game\balance_runs\%%d" & goto :done)
:done
pause
