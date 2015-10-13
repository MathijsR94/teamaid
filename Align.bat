cd platforms\android\build\outputs\apk
del TeamAid.apk
zipalign -v 4 android-release-unsigned.apk TeamAid.apk
exit