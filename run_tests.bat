@echo off
title DocuSupport AI - Run Tests
echo ========================================================
echo   Running Automated Test Suite for RAG Chatbot
echo ========================================================
echo.
python backend\tests\test_rag.py
echo.
pause
