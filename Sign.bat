cd platforms\android\build\outputs\apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore teamaid-release-key.keystore android-release-unsigned.apk alias_name
exit